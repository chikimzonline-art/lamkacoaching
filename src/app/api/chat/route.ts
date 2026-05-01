import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

const SYSTEM_PROMPT =
  'You are a helpful assistant for Lamka Coaching Center. You help students with queries about courses, fees, cabin bookings, exam preparation, and general information. Be friendly, concise, and encouraging. The center offers competitive exam coaching (SSC, Banking, UPSC), computer training (CCC, Tally, Web Design), and study cabin facilities. Located in Lamka, Manipur.';

const MAX_MESSAGES = 20;

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
}

// In-memory conversation store
const conversations = new Map<string, ChatMessage[]>();

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

    // Get or create conversation
    let history = conversations.get(sid);
    if (!history) {
      history = [{ role: 'assistant', content: SYSTEM_PROMPT }];
      conversations.set(sid, history);
    }

    // Add user message
    history.push({ role: 'user', content: message.trim() });

    // Trim old messages if exceeding limit (keep system prompt)
    if (history.length > MAX_MESSAGES + 1) {
      const excess = history.length - (MAX_MESSAGES + 1);
      history.splice(1, excess); // Remove oldest messages after system prompt
    }

    // Create ZAI instance and call chat completions
    const zai = await ZAI.create();
    const result = await zai.chat.completions.create({
      messages: history,
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

    // Add assistant response to history
    history.push({ role: 'assistant', content: assistantMessage });

    // Trim again if needed after adding assistant message
    if (history.length > MAX_MESSAGES + 1) {
      const excess = history.length - (MAX_MESSAGES + 1);
      history.splice(1, excess);
    }

    return NextResponse.json({ response: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again later.' },
      { status: 500 }
    );
  }
}
