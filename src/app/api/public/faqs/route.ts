import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const faqs = await db.fAQ.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error fetching public FAQs:', error);
    return NextResponse.json({ faqs: [] }, { status: 500 });
  }
}
