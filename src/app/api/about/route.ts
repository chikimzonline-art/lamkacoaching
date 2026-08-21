import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/auth';

// GET /api/about - get all about data (staff/admin)
export async function GET() {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const aboutKeys = [
      'about_story',
      'about_story_extra',
      'about_story_closing',
      'about_mission',
      'about_vision',
    ];

    const [teamMembers, milestones, galleryItems, settings] = await db.$transaction([
      db.teamMember.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      db.aboutMilestone.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      db.campusGalleryItem.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      db.setting.findMany({
        where: { key: { in: aboutKeys } },
      }),
    ]);

    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return NextResponse.json({
      teamMembers,
      milestones,
      galleryItems,
      settings: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching about data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about data' },
      { status: 500 }
    );
  }
}

// POST /api/about - Admin: CRUD operations (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    const { action, type, data, id } = body;

    // Handle settings update
    if (type === 'settings') {
      const settings = data as Record<string, string>;
      const upserts = Object.entries(settings).map(([key, value]) =>
        db.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      );
      const results = await db.$transaction(upserts);
      return NextResponse.json({ success: true, settings: results });
    }

    // Handle team member CRUD
    if (type === 'teamMember') {
      if (action === 'create') {
        const member = await db.teamMember.create({
          data: {
            name: data.name,
            role: data.role,
            bio: data.bio,
            initials: data.initials,
            color: data.color || 'from-cyan-500 to-sky-500',
            sortOrder: data.sortOrder ?? 0,
            active: data.active ?? true,
          },
        });
        return NextResponse.json({ success: true, member });
      }

      if (action === 'update') {
        const member = await db.teamMember.update({
          where: { id },
          data: {
            name: data.name,
            role: data.role,
            bio: data.bio,
            initials: data.initials,
            color: data.color,
            sortOrder: data.sortOrder,
            active: data.active,
          },
        });
        return NextResponse.json({ success: true, member });
      }

      if (action === 'delete') {
        await db.teamMember.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
    }

    // Handle milestone CRUD
    if (type === 'milestone') {
      if (action === 'create') {
        const milestone = await db.aboutMilestone.create({
          data: {
            year: data.year,
            event: data.event,
            sortOrder: data.sortOrder ?? 0,
          },
        });
        return NextResponse.json({ success: true, milestone });
      }

      if (action === 'update') {
        const milestone = await db.aboutMilestone.update({
          where: { id },
          data: {
            year: data.year,
            event: data.event,
            sortOrder: data.sortOrder,
          },
        });
        return NextResponse.json({ success: true, milestone });
      }

      if (action === 'delete') {
        await db.aboutMilestone.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
    }

    // Handle campus gallery CRUD
    if (type === 'campusGallery') {
      if (action === 'create') {
        const item = await db.campusGalleryItem.create({
          data: {
            title: data.title,
            description: data.description,
            image: data.image,
            colSpan: data.colSpan || '',
            rowSpan: data.rowSpan || '',
            sortOrder: data.sortOrder ?? 0,
            active: data.active ?? true,
          },
        });
        return NextResponse.json({ success: true, item });
      }

      if (action === 'update') {
        const item = await db.campusGalleryItem.update({
          where: { id },
          data: {
            title: data.title,
            description: data.description,
            image: data.image,
            colSpan: data.colSpan,
            rowSpan: data.rowSpan,
            sortOrder: data.sortOrder,
            active: data.active,
          },
        });
        return NextResponse.json({ success: true, item });
      }

      if (action === 'delete') {
        await db.campusGalleryItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in about API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
