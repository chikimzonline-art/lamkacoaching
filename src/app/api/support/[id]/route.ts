import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStaffOrAdmin } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    const { status, adminReply } = await req.json();

    const ticket = await db.supportTicket.update({
      where: { id },
      data: {
        status,
        ...(adminReply !== undefined && { adminReply }),
      },
    });

    if (adminReply && ticket.studentId) {
      import('@/lib/fcm-server').then((fcm) => {
        fcm.sendPushNotificationToStudent({
          studentId: ticket.studentId,
          title: `💬 Support Reply: ${ticket.subject}`,
          body: adminReply.length > 120 ? `${adminReply.slice(0, 117)}...` : adminReply,
          channelId: 'channel_support',
          link: '/dashboard/support',
        }).catch((e) => console.error('Failed to send support ticket reply push', e));
      });
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStaffOrAdmin();
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await params;
    await db.supportTicket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
