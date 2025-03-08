import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

// Check required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];  // Remove GROQ_API_KEY since we're not using it
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is not set`);
  }
}

import express, { Request, Response } from 'express';
import cors from 'cors';
import transcribeHandler from './api/transcribe';
import chatHandler from './api/chat';

const app = express();
const PORT = 3001;

// Enable CORS
app.use(cors({
  origin: '*',  // Allow all origins for now
  methods: ['POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API routes
app.post('/api/transcribe', (req: Request, res: Response) => transcribeHandler(req as any, res as any));
app.post('/api/chat', (req: Request, res: Response) => chatHandler(req as any, res as any));

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
}); 