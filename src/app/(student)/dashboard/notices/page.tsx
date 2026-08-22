import { requireStudent } from "@/lib/student-auth";
import { db } from "@/lib/db";
import { StudentNoticesView, StudentNoticeItem } from "@/components/notices/student-notices-view";

export default async function DashboardNoticesPage() {
  await requireStudent();

  const notices = await db.notice.findMany({
    where: { status: "published" },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  const formattedNotices: StudentNoticeItem[] = notices.map((n) => ({
    id: n.id,
    title: n.title,
    content: n.content,
    pinned: n.pinned,
    status: n.status,
    createdAt: n.createdAt.toISOString(),
  }));

  return <StudentNoticesView initialNotices={formattedNotices} />;
}
