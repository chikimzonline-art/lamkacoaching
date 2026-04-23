import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/settings - Public: get business info settings
export async function GET() {
  try {
    const publicKeys = [
      'businessName',
      'businessPhone',
      'businessEmail',
      'businessAddress',
      'businessDescription',
    ];

    const settings = await db.setting.findMany({
      where: { key: { in: publicKeys } },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
