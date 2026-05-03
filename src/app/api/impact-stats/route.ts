import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all impact stats (admin)
export async function GET() {
  try {
    const stats = await db.impactStat.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching impact stats:', error);
    return NextResponse.json({ error: 'Failed to fetch impact stats' }, { status: 500 });
  }
}

// POST create new impact stat
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, value, suffix, iconName, iconBg, iconColor, numberColor, sortOrder, active } = body;
    
    if (!label || value === undefined) {
      return NextResponse.json({ error: 'Label and value are required' }, { status: 400 });
    }

    const stat = await db.impactStat.create({
      data: { label, value, suffix: suffix || '+', iconName: iconName || 'GraduationCap', iconBg: iconBg || 'bg-cyan-500/20', iconColor: iconColor || 'text-cyan-400', numberColor: numberColor || 'text-cyan-400', sortOrder: sortOrder || 0, active: active !== undefined ? active : true },
    });
    return NextResponse.json({ stat }, { status: 201 });
  } catch (error) {
    console.error('Error creating impact stat:', error);
    return NextResponse.json({ error: 'Failed to create impact stat' }, { status: 500 });
  }
}

// PUT update impact stat
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const stat = await db.impactStat.update({
      where: { id },
      data,
    });
    return NextResponse.json({ stat });
  } catch (error) {
    console.error('Error updating impact stat:', error);
    return NextResponse.json({ error: 'Failed to update impact stat' }, { status: 500 });
  }
}
