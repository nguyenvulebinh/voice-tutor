import { API_CONFIG } from '@/config/api';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamResponse {
  text: string;
  status: 'in_progress' | 'completed' | 'error';
  corrections?: Array<{
    original: string;
    corrected: string;
    explanation: string;
  }>;
  language?: string;
  error?: string;
  verified?: boolean;
}

export async function verifyAccessCode(code: string): Promise<boolean> {
  try {
    const requestBody = {
      messages: [{ role: 'user', content: code }],
      isVerification: true,
      accessCode: code
    };
    console.log('Sending verification request...');

    const response = await fetch(`${API_CONFIG.API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Verification response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Verification error response:', error);
      throw new Error(error.error || 'Failed to verify access code');
    }

    const data = await response.json();
    console.log('Verification result:', data.verified);
    return data.verified;
  } catch (error) {
    console.error('Verification error:', error);
    return false;
  }
}

export async function getChatResponse(
  messages: Message[],
  accessCode: string,
  onUpdate?: (response: StreamResponse) => void
): Promise<{ data?: StreamResponse; error?: string }> {
  try {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        messages,
        accessCode 
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get chat response');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response stream available');
    }

    let lastResponse: StreamResponse | undefined;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Convert the chunk to text
      const chunk = new TextDecoder().decode(value);
      const lines = chunk.split('\n');

      // Process each line
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            lastResponse = data;
            onUpdate?.(data);

            if (data.status === 'completed' || data.status === 'error') {
              reader.cancel();
              if (data.error) {
                throw new Error(data.error);
              }
              return { data };
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }

    return lastResponse ? { data: lastResponse } : { error: 'No response received' };
  } catch (error) {
    console.error('Chat error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to get chat response' };
  }
} 