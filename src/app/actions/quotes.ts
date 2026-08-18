'use server';

import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export async function getDailyQuotes() {
  try {
    const quotes = await redis.get('daily_inspirations');
    
    // Check if quotes exist and is an array
    if (quotes && Array.isArray(quotes) && quotes.length > 0) {
      return quotes;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to fetch daily quotes from Redis:', error);
    return null;
  }
}
