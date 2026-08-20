import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { Redis } from '@upstash/redis';
import { callGeminiAPI, extractTextFromResponse } from '@/lib/gemini';

// Initialize Redis client
const redis = Redis.fromEnv();

interface QuoteItem {
  text: string;
  author: string;
}

// Day of week thematic focus (IST)
const DAY_THEMES: Record<string, string> = {
  Monday: 'Discipline, fresh starts, setting bold intentions, and taking the first step.',
  Tuesday: 'Deep focus, consistency, overcoming procrastination, and productive work habits.',
  Wednesday: 'Resilience, grit, bouncing back from setbacks, and relentless perseverance.',
  Thursday: 'Ambition, personal mastery, long-term vision, and continuous self-improvement.',
  Friday: 'Finishing strong, dedication, seeing tasks through, and pride in honest effort.',
  Saturday: 'Curiosity, lifelong learning, skill development, and expanding horizons.',
  Sunday: 'Mindset, wisdom, inner calm, patience, and celebrating steady progress.',
};

// Function to generate and save quotes
async function generateAndSaveQuotes() {
  // 1. Determine current day of week in Asia/Kolkata timezone
  const istDate = new Date();
  const dayOfWeek = istDate.toLocaleDateString('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  });
  const theme = DAY_THEMES[dayOfWeek] || 'Excellence, perseverance, and dedication in learning.';

  // 2. Fetch past quotes history from Redis to prevent repetition
  let pastQuotes: QuoteItem[] = [];
  try {
    const history = await redis.get<QuoteItem[]>('daily_quotes_history');
    if (Array.isArray(history)) {
      pastQuotes = history.filter((q) => q && typeof q.text === 'string' && typeof q.author === 'string');
    }
  } catch (err) {
    console.warn('Could not retrieve past quotes history from Redis:', err);
  }

  // Format list of past quotes for prompt exclusion
  const exclusionText = pastQuotes.length > 0
    ? `Do NOT repeat or closely paraphrase any of the following recently used quotes or authors:\n${pastQuotes
        .slice(0, 14)
        .map((q, idx) => `${idx + 1}. "${q.text}" — ${q.author}`)
        .join('\n')}`
    : 'Ensure the quote is unique and fresh.';

  const prompt = `
    You are an inspiring mentor and educator.
    Today is ${dayOfWeek}. The theme of the day is: ${theme}
    
    Generate 1 powerful, memorable, and concise motivational quote suitable for competitive exam aspirants, students, and professionals.
    
    Rules:
    1. Focus on the theme: ${theme}
    2. ${exclusionText}
    3. The quote can be from famous philosophers, scientists, writers, leaders, or original timeless wisdom.
    4. Keep the text concise (1-2 sentences).
    5. Return the response strictly as a single JSON object with "text" and "author" keys.
    6. Do NOT wrap in markdown code fences or arrays.
    
    Example JSON format:
    { "text": "Action is the foundational key to all success.", "author": "Pablo Picasso" }
  `;

  try {
    // Call Gemini API with elevated temperature for creativity & diversity
    const response = await callGeminiAPI({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.9,
        responseMimeType: 'application/json',
      },
    });

    const text = extractTextFromResponse(response);
    
    // Clean up potential markdown blocks from the response
    const cleanJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse the JSON
    const parsed = JSON.parse(cleanJsonString);
    const quote: QuoteItem = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!quote || typeof quote.text !== 'string' || typeof quote.author !== 'string') {
      throw new Error('Invalid quote format returned from Gemini');
    }

    // 3. Save to Upstash Redis
    await redis.set('daily_inspiration', quote);
    await redis.set('daily_inspirations', [quote]);

    // 4. Update rolling history (keep last 14 unique quotes)
    const updatedHistory: QuoteItem[] = [
      quote,
      ...pastQuotes.filter((q) => q.text.toLowerCase() !== quote.text.toLowerCase()),
    ].slice(0, 14);

    await redis.set('daily_quotes_history', updatedHistory);
    
    return { success: true, quote, day: dayOfWeek, theme };
  } catch (error) {
    console.error('Error generating daily quote:', error);
    throw error;
  }
}

// The QStash handler (POST is required for QStash webhooks)
async function handler(req: Request) {
  try {
    const result = await generateAndSaveQuotes();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate quotes' },
      { status: 500 }
    );
  }
}

// We only apply the QStash signature verification in production
// to allow easy manual testing in development.
export const POST = process.env.NODE_ENV === 'development' 
  ? handler 
  : verifySignatureAppRouter(handler);

// Optional: allow GET requests for easier manual testing in development
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }
  
  try {
    const result = await generateAndSaveQuotes();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate quotes' },
      { status: 500 }
    );
  }
}
