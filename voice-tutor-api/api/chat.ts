import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import cors from 'cors';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const ASSISTANT_ID = 'asst_djFanTAW6P9SUqjhhJqnnrHL';

// Get verification code from environment variable
const verificationCode = process.env.VERIFICATION_CODE || '';

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

// Helper function to extract corrections from text
function extractCorrections(text: string) {
  const corrections = [];
  const regex = /Original:\s*"([^"]*)"\s*Correction:\s*"([^"]*)"\s*Explanation:\s*([^\n]*)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    corrections.push({
      original: match[1],
      corrected: match[2],
      explanation: match[3]
    });
  }

  return corrections;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Run CORS middleware
    await runMiddleware(req, res, corsMiddleware);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, isVerification, accessCode } = req.body;
    
    // Log incoming request
    console.log('Chat API Request:', {
      isVerification,
      messageCount: messages?.length,
      lastMessageRole: messages?.[messages?.length - 1]?.role,
      lastMessagePreview: messages?.[messages?.length - 1]?.content?.slice(0, 50) + '...'
    });

    if (!messages) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    // Verify access code
    const expectedCode = verificationCode.trim().toLowerCase();
    const providedCode = (isVerification ? messages[messages.length - 1].content : accessCode || '').trim().toLowerCase();
    
    console.log('Access verification:', {
      isVerification,
      matches: providedCode === expectedCode,
      providedCodeLength: providedCode.length,
      expectedCodeLength: expectedCode.length
    });

    // For verification requests, just return the result
    if (isVerification) {
      return res.json({
        verified: providedCode === expectedCode,
        status: 'completed'
      });
    }

    // For chat requests, verify the access code
    if (providedCode !== expectedCode) {
      console.log('Invalid access code provided');
      return res.json({
        error: 'Invalid access code',
        status: 'error'
      });
    }

    // Set up streaming response headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Create a thread
    console.log('Creating OpenAI thread...');
    const thread = await openai.beta.threads.create();
    console.log('Thread created:', thread.id);

    // Add the messages to the thread
    console.log('Adding messages to thread...');
    for (const message of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content
      });
    }
    console.log('Messages added to thread');

    // Run the assistant
    console.log('Starting assistant run...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID
    });
    console.log('Assistant run started:', run.id);

    // Poll for completion and stream the response
    let fullResponse = '';
    let pollCount = 0;
    while (true) {
      pollCount++;
      console.log(`Polling run status (attempt ${pollCount})...`);
      
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      console.log('Run status:', runStatus.status);
      
      if (runStatus.status === 'completed') {
        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(thread.id);
        const lastMessage = messages.data[0];
        
        if (lastMessage.role === 'assistant') {
          const messageContent = lastMessage.content[0];
          if (messageContent.type === 'text') {
            const content = messageContent.text.value;
            fullResponse = content;
            
            // Extract corrections
            const corrections = extractCorrections(content);
            console.log('Response processed:', {
              contentLength: content.length,
              correctionsCount: corrections.length
            });

            // Send the final message
            res.write(`data: ${JSON.stringify({
              text: content,
              corrections,
              status: 'completed',
              language: 'de'
            })}\n\n`);
          }
        }
        break;
      } else if (runStatus.status === 'failed') {
        console.error('Assistant run failed:', runStatus);
        throw new Error('Assistant run failed');
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // End the stream
    console.log('Chat response completed successfully');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to get response',
      status: 'error'
    })}\n\n`);
    res.end();
  }
} 