import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, requireStaffOrAdmin } from '@/lib/auth';

// GET — list all feature cards (staff/admin)
export async function GET() {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const cards = await db.featureCard.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ cards });
  } catch (error) {
    console.error('GET /api/feature-cards error:', error);
    return NextResponse.json({ error: 'Failed to fetch feature cards' }, { status: 500 });
  }
}

// POST — create a new feature card (admin only)
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { title, description, image, icon, linkText, linkHref, sortOrder, active } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const card = await db.featureCard.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        image: image?.trim() || '',
        icon: icon?.trim() || 'GraduationCap',
        linkText: linkText?.trim() || 'Learn More',
        linkHref: linkHref?.trim() || '/',
        sortOrder: sortOrder ?? 0,
        active: active ?? true,
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    console.error('POST /api/feature-cards error:', error);
    return NextResponse.json({ error: 'Failed to create feature card' }, { status: 500 });
  }
}

// PUT — update an existing feature card (admin only)
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const card = await db.featureCard.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.linkText !== undefined && { linkText: data.linkText }),
        ...(data.linkHref !== undefined && { linkHref: data.linkHref }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error('PUT /api/feature-cards error:', error);
    return NextResponse.json({ error: 'Failed to update feature card' }, { status: 500 });
  }
}

// DELETE — remove a feature card (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.featureCard.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/feature-cards error:', error);
    return NextResponse.json({ error: 'Failed to delete feature card' }, { status: 500 });
  }
}
