import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/about - Public: get about page data
export async function GET() {
  try {
    // Fetch team members
    const teamMembers = await db.teamMember.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch milestones
    const milestones = await db.aboutMilestone.findMany({
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
      settings: settingsMap,
    });
  } catch (error) {
    console.error('Error fetching public about data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch about data' },
      { status: 500 }
    );
  }
}
