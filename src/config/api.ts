export const API_CONFIG = {
  API_BASE_URL: 'https://voice-tutor-api.vercel.app/api',
  CORRECTIONS_ENDPOINT: '/corrections',
  CHAT_ENDPOINT: '/chat'
};

export function validateConfig(): boolean {
  return true;
} 