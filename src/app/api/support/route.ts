import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaffOrAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const tickets = await db.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
