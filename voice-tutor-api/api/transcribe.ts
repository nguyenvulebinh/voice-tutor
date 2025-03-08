import { VercelRequest, VercelResponse } from '@vercel/node';
import { Groq } from 'groq-sdk';
import cors from 'cors';
import multer from 'multer';
import { promisify } from 'util';
import fs from 'fs';
import { saveTempFile } from '../utils/file';

interface MulterRequest extends VercelRequest {
  file?: Express.Multer.File;
}

// Get verification code from environment variable
const verificationCode = process.env.VERIFICATION_CODE || '';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single('file');

// Promisify multer middleware
const runMulter = promisify(upload);

// Configure CORS
const corsMiddleware = cors({
  origin: '*',  // Allow all origins for now
  methods: ['POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Helper function to run middleware
const runMiddleware = (req: VercelRequest, res: VercelResponse, fn: Function) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(req: VercelRequest & MulterRequest, res: VercelResponse) {
  let tempFilePath: string | undefined;
  
  try {
    // Run CORS middleware
    await runMiddleware(req, res, corsMiddleware);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle file upload
    await runMulter(req as any, res as any);

    // Verify access code from form data
    const accessCode = req.body?.accessCode;
    if (!accessCode) {
      return res.status(400).json({ error: 'Access code is required' });
    }

    // Verify access code
    const expectedCode = verificationCode.trim().toLowerCase();
    const providedCode = accessCode.trim().toLowerCase();
    
    if (providedCode !== expectedCode) {
      return res.status(401).json({
        error: 'Invalid access code',
        status: 'error'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Save to temporary file
    tempFilePath = await saveTempFile(req.file.buffer, '.webm');

    const response = await groq.audio.transcriptions.create({
      model: 'whisper-large-v3-turbo',
      file: fs.createReadStream(tempFilePath),
      response_format: 'json',
      temperature: 0,
      language: 'de'
    });

    res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to transcribe audio' 
    });
  } finally {
    // Clean up temporary file
    if (tempFilePath) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }
  }
} 