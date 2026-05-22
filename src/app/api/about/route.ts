import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import type { Setting } from '@prisma/client';

// Helper to verify auth


// GET /api/about - Admin: get all about data
export async function GET() {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMembers = await db.teamMember.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const milestones = await db.aboutMilestone.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    const galleryItems = await db.campusGalleryItem.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch about-related settings
    const aboutKeys = [
      'about_story',
      'about_story_extra',
      'about_story_closing',
      'about_mission',
      'about_vision',
    ];

    const settings = await db.setting.findMany({
      where: { key: { in: aboutKeys } },
    });

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

// POST /api/about - Admin: CRUD operations
export async function POST(request: Request) {
  try {
    const user = await getAuthUser(await cookies());
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, type, data, id } = body;

    // Handle settings update
    if (type === 'settings') {
      const settings = data as Record<string, string>;
      const results: Setting[] = [];
      for (const [key, value] of Object.entries(settings)) {
        const result = await db.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        });
        results.push(result);
      }
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
