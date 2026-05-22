import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/settings - Public: get business info settings
export async function GET() {
  try {
    // DB stores snake_case keys; map to camelCase for frontend consumption
    const keyMap: Record<string, string> = {
      'business_name': 'businessName',
      'business_phone': 'businessPhone',
      'business_email': 'businessEmail',
      'business_address': 'businessAddress',
      'business_description': 'businessDescription',
      'hero_badge_text': 'heroBadgeText',
      'hero_banner_text': 'heroBannerText',
      'footer_cta_title': 'footerCtaTitle',
      'footer_cta_subtitle': 'footerCtaSubtitle',
      'logo_url': 'logoUrl',
      'favicon_url': 'faviconUrl',
    };

    const settings = await db.setting.findMany({
      where: { key: { in: Object.keys(keyMap) } },
    });

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      const camelKey = keyMap[s.key] || s.key;
      settingsMap[camelKey] = s.value;
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
