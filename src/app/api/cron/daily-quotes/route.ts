import { NextResponse } from 'next/server';
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs';
import { Redis } from '@upstash/redis';
import { callGeminiAPI, extractTextFromResponse } from '@/lib/gemini';

// Initialize Redis client
const redis = Redis.fromEnv();

// Function to generate and save quotes
async function generateAndSaveQuotes() {
  const prompt = `
    Generate 1 highly motivational, inspiring, and concise quote for students and professionals.
    The quote should focus on success, perseverance, education, dedication, or believing in oneself.
    
    Return the response strictly as a single JSON object with "text" and "author" keys.
    Do not include markdown blocks or array wrappers, just the raw JSON object.
    Example:
    { "text": "The only way to do great work is to love what you do.", "author": "Steve Jobs" }
  `;

  try {
    // Call Gemini API
    const response = await callGeminiAPI({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = extractTextFromResponse(response);
    
    // Clean up potential markdown blocks from the response
    const cleanJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Parse the JSON
    const parsed = JSON.parse(cleanJsonString);
    const quote = Array.isArray(parsed) ? parsed[0] : parsed;

    if (!quote || typeof quote.text !== 'string' || typeof quote.author !== 'string') {
      throw new Error('Invalid quote format returned from Gemini');
    }

    // Save to Upstash Redis (both keys for compatibility)
    await redis.set('daily_inspiration', quote);
    await redis.set('daily_inspirations', [quote]);
    
    return { success: true, quote };
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
