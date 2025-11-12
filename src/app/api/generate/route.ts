import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { prompt, body } = await req.json();
    const { option, command } = body || {};

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful AI writing assistant. You help users improve their writing by providing suggestions and edits.'
        },
        {
          role: 'user',
          content: `Task: ${option}\nCommand: ${command}\nText: ${prompt}`
        }
      ]
    });

    return new Response(response.toReadableStream());
  } catch (error) {
    console.error('Error in generate API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
