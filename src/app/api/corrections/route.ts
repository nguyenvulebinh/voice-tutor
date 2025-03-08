import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VALID_ACCESS_CODE = process.env.ACCESS_CODE;

export const dynamic = 'force-dynamic';  // This ensures the route is always dynamic

export async function POST(request: NextRequest) {
  try {
    const { text, accessCode, assistantId } = await request.json();

    // Verify access code
    if (accessCode !== VALID_ACCESS_CODE) {
      return NextResponse.json({ error: 'Invalid access code' }, { status: 401 });
    }

    // Create a thread
    const thread = await openai.beta.threads.create();

    // Add the user's message to the thread
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

      try {
        const response = JSON.parse(lastMessage.content[0].text.value);
        return NextResponse.json(response);
      } catch (e) {
        console.error('Error parsing response:', e);
        return NextResponse.json({
          error: 'Invalid response format from assistant'
        }, { status: 500 });
      }
    } else {
      throw new Error(`Run failed with status: ${runStatus.status}`);
    }
  } catch (error) {
    console.error('Correction API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 