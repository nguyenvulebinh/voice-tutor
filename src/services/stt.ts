import { ApiResponse } from './api';
import { API_CONFIG, validateConfig } from '../config/api';

export async function transcribeAudio(audioBlob: Blob, accessCode: string): Promise<ApiResponse<string>> {
  if (!validateConfig()) {
    return { 
      data: '', 
      error: 'API configuration is not valid' 
    };
  }

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('accessCode', accessCode);

    console.log('Sending audio for transcription...');
    const response = await fetch(`${API_CONFIG.API_BASE_URL}/transcribe`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transcribe audio');
    }

    const data = await response.json();
    console.log('Received transcription:', data);

    if (!data.text) {
      throw new Error('No transcription received');
    }

    return { data: data.text };
  } catch (error) {
    console.error('STT error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { 
      data: '', 
      error: error instanceof Error ? error.message : 'Failed to transcribe audio' 
    };
  }
} 