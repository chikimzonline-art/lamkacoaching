import { Redis } from '@upstash/redis';
import { callGeminiAPI, extractTextFromResponse } from '@/lib/gemini';

// Initialize Redis client
const redis = Redis.fromEnv();

async function run() {
  console.log("Starting generation...");
  const prompt = `
    Generate 5 highly motivational, inspiring, and concise quotes for students and professionals.
    The quotes should focus on success, perseverance, education, and believing in oneself.
    
    Return the response strictly as a JSON array of objects with "text" and "author" keys.
    Do not include markdown blocks, just the raw JSON array.
    Example:
    [
      { "text": "The only way to do great work is to love what you do.", "author": "Steve Jobs" }
    ]
  `;

  try {
    const response = await callGeminiAPI({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = extractTextFromResponse(response);
    const cleanJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const quotes = JSON.parse(cleanJsonString);

    console.log("Quotes generated:", quotes);
    await redis.set('daily_inspirations', quotes);
    console.log("Quotes saved to Redis!");
  } catch (error) {
    console.error('Error generating daily quotes:', error);
  }
}

run();
