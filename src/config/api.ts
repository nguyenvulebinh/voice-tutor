export const API_CONFIG = {
  API_BASE_URL: 'https://voice-tutor-api.vercel.app/api',
};

export function validateConfig(): boolean {
  return !!API_CONFIG.API_BASE_URL;
} 