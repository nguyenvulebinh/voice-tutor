import { API_CONFIG } from '../config/api';

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function getAssistantResponse(messages: AssistantMessage[]) {
  try {
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        assistantId: API_CONFIG.OPENAI_ASSISTANT_ID
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get assistant response');
    }

    const data = await response.json();
    return {
      text: data.text,
      corrections: data.corrections,
      language: data.language || 'en'
    };
  } catch (error) {
    console.error('Error in OpenAI Assistant:', error);
    throw error;
  }
}

function extractCorrections(text: string) {
  const corrections = [];
  const correctionRegex = /Original: "(.*?)"\s*Corrected: "(.*?)"\s*Explanation: (.*?)(?=\n|$)/g;
  
  let match;
  while ((match = correctionRegex.exec(text)) !== null) {
    corrections.push({
      original: match[1],
      corrected: match[2],
      explanation: match[3].trim()
    });
  }

  return corrections;
} 