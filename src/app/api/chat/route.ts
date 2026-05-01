import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';

const SYSTEM_PROMPT =
  'You are a helpful assistant for Lamka Coaching Center. You help students with queries about courses, fees, cabin bookings, exam preparation, and general information. Be friendly, concise, and encouraging. The center offers competitive exam coaching (SSC, Banking, UPSC), computer training (CCC, Tally, Web Design), and study cabin facilities. Located in Lamka, Manipur.';

const MAX_CONTEXT_MESSAGES = 18;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const sid = sessionId || 'default';

    // Save the user message to the database
    await db.chatMessage.create({
      data: {
        sessionId: sid,
        role: 'user',
        content: message.trim(),
      },
    });

    // Load the last 18 messages for this session from DB (to build context)
    const recentMessages = await db.chatMessage.findMany({
      where: { sessionId: sid },
      orderBy: { createdAt: 'desc' },
      take: MAX_CONTEXT_MESSAGES,
    });

    // Reverse to get chronological order
    const orderedMessages = recentMessages.reverse();

    // Build the messages array with system prompt prepended
    const messages = [
      { role: 'assistant' as const, content: SYSTEM_PROMPT },
      ...orderedMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    // Create ZAI instance and call chat completions
    const zai = await ZAI.create();
    const result = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    // Extract assistant response
    let assistantMessage = '';
    if (result?.choices?.[0]?.message?.content) {
      assistantMessage = result.choices[0].message.content;
    } else if (typeof result === 'string') {
      assistantMessage = result;
    } else {
      assistantMessage = "I'm sorry, I couldn't generate a response. Please try again.";
    }

    // Save the assistant response to the database
    await db.chatMessage.create({
      data: {
        sessionId: sid,
        role: 'assistant',
        content: assistantMessage,
      },
    });

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again later.' },
      { status: 500 }
    );
  }
}
