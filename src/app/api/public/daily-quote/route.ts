import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

const DEFAULT_QUOTE = {
  text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing or learning to do.",
  author: "Pelé",
};

export async function GET() {
  try {
    let quote: { text: string; author: string } | null = null;

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redis = Redis.fromEnv();
      const cached = await redis.get<{ text: string; author: string } | Array<{ text: string; author: string }>>('daily_inspiration');

      if (cached) {
        if (Array.isArray(cached) && cached.length > 0) {
          quote = cached[0];
        } else if (typeof cached === 'object' && 'text' in cached && 'author' in cached) {
          quote = cached;
        }
      } else {
        // Check daily_inspirations fallback list
        const fallbackList = await redis.get<Array<{ text: string; author: string }>>('daily_inspirations');
        if (Array.isArray(fallbackList) && fallbackList.length > 0) {
          quote = fallbackList[0];
        }
      }
    }

    return NextResponse.json({
      quote: quote || DEFAULT_QUOTE,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Error fetching daily quote from Redis:', error);
    return NextResponse.json({
      quote: DEFAULT_QUOTE,
    });
  }
}
