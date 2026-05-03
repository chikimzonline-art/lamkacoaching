import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all testimonials (admin)
export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
  }
}

// POST create new testimonial
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, course, badge, badgeColor, text, rating, avatar, gradient, sortOrder, active } = body;
    
    if (!name || !course || !text) {
      return NextResponse.json({ error: 'Name, course, and text are required' }, { status: 400 });
    }

    const testimonial = await db.testimonial.create({
      data: { name, course, badge: badge || course, badgeColor: badgeColor || 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', text, rating: rating || 5, avatar: avatar || name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), gradient: gradient || 'from-cyan-500 to-teal-500', sortOrder: sortOrder || 0, active: active !== undefined ? active : true },
    });
    return NextResponse.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
  }
}

// PUT update testimonial
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const testimonial = await db.testimonial.update({
      where: { id },
      data,
    });
    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}
