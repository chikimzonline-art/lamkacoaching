import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET /api/settings - Get all settings (staff/admin)
export async function GET() {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const settings = await db.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return NextResponse.json({ settings: settingsMap });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// POST /api/settings - Update settings (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { settings } = body; // { key: value, ... }

    const upserts = Object.entries(settings).map(([key, value]) =>
      db.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );
    const results = await db.$transaction(upserts);

    await logAudit({
      user: auth.user,
      action: 'SETTINGS_UPDATED',
      entityType: 'Setting',
      description: `Updated system settings (${Object.keys(settings).join(', ')})`,
      details: { keys: Object.keys(settings), values: settings },
      req: request,
    });

    return NextResponse.json({ settings: results });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
