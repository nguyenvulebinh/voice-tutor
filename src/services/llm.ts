import { ApiResponse, getRandomMockResponse } from './api';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  text: string;
  language?: string;
  corrections?: {
    original: string;
    corrected: string;
    explanation: string;
  }[];
}

export async function getChatResponse(messages: Message[]): Promise<ApiResponse<ChatResponse>> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  try {
    // For prototype, return a random mock response
    const mockResponse = getRandomMockResponse();
    return { data: mockResponse };
  } catch (error) {
    console.error('LLM error:', error);
    return {
      data: { text: 'Sorry, I encountered an error. Please try again.' },
      error: error instanceof Error ? error.message : 'Failed to get response'
    };
  }
} 