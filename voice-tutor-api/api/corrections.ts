import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Get verification code from environment variable
const verificationCode = process.env.VERIFICATION_CODE || '';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, messages, accessCode, assistantId } = request.body;

    // Verify access code
    if (accessCode !== verificationCode) {
      return response.status(401).json({ error: 'Invalid access code' });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the conversation history to the thread
    if (messages && messages.length > 0) {
      for (const msg of messages) {
        await openai.beta.threads.messages.create(thread.id, {
          role: msg.role,
          content: msg.content
        });
      }
    }

    // Add the current message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: text
    });

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistantId
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status === 'in_progress' || runStatus.status === 'queued') {
      await new Promise(resolve => setTimeout(resolve, 500));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    if (runStatus.status === 'completed') {
      // Get the assistant's response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[0];

      if (!lastMessage || !lastMessage.content[0] || lastMessage.content[0].type !== 'text') {
        throw new Error('Invalid response format');
      }

      // Return the raw response text
      return response.status(200).json({
        rawResponse: lastMessage.content[0].text.value
      });
    } else {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
  } catch (error) {
    console.error('Correction API error:', error);
    return response.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
} 