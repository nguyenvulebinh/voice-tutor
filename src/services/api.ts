// Mock data for prototype
const MOCK_RESPONSES = [
  {
    text: "That's a good attempt! Let me help you with some corrections.",
    language: 'en',
    corrections: [
      {
        original: "I goed to the store yesterday",
        corrected: "I went to the store yesterday",
        explanation: "The past tense of 'go' is 'went', not 'goed'."
      }
    ]
  },
  {
    text: "Great progress! Here's a small suggestion to improve your sentence.",
    language: 'en',
    corrections: [
      {
        original: "She don't like coffee",
        corrected: "She doesn't like coffee",
        explanation: "With third-person singular (he/she/it), we use 'doesn't' instead of 'don't'."
      }
    ]
  },
  {
    text: "You're doing well! Let's work on your pronunciation.",
    language: 'en',
    corrections: [
      {
        original: "I want to improve my english",
        corrected: "I want to improve my English",
        explanation: "The word 'English' should be capitalized as it's a proper noun."
      }
    ]
  }
];

// Simulated audio data URL for prototype
const MOCK_AUDIO = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tQwAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhgC1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1//tQxAAAAAAAAAAAAAAAAAAAAAADS';

// Update these URLs with your actual service endpoints
export const API_ENDPOINTS = {
  STT: 'https://your-stt-service.com/api/transcribe',
  LLM: 'https://your-llm-service.com/api/chat',
  TTS: 'https://your-tts-service.com/api/synthesize',
} as const;

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

// Helper function to get random mock response
export function getRandomMockResponse() {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

// Helper function to get mock audio
export function getMockAudio() {
  return MOCK_AUDIO;
} 