import { ApiResponse } from './api';

const MOCK_TRANSCRIPTIONS = [
  "I goed to the store yesterday",
  "She don't like coffee",
  "I want to improve my english",
  "Can you help me practice my pronunciation?",
  "I am learning English for two years"
];

export async function transcribeAudio(audioBlob: Blob): Promise<ApiResponse<string>> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  try {
    // For prototype, return a random mock transcription
    const mockText = MOCK_TRANSCRIPTIONS[Math.floor(Math.random() * MOCK_TRANSCRIPTIONS.length)];
    return { data: mockText };
  } catch (error) {
    console.error('STT error:', error);
    return { data: '', error: error instanceof Error ? error.message : 'Failed to transcribe audio' };
  }
} 