import { db } from '@/lib/db';
import NoticesClient from './notices-client';

export default async function NoticesPage() {
  const notices = await db.notice.findMany({
    where: { status: 'published' },
    orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  // Serialize dates to strings for client component
  const serializedNotices = notices.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    pinned: n.pinned,
    createdAt: n.createdAt.toISOString(),
  }));

  return <NoticesClient initialNotices={serializedNotices} />;
}
