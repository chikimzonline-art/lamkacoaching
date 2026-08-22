import { requireStudent } from "@/lib/student-auth";
import { ScheduleView, ScheduleEnrollment } from "@/components/schedule/schedule-view";

export default async function DashboardSchedulePage() {
  const { student } = await requireStudent();

  const initialEnrollments = (student.enrollments || []).map((e: any) => ({
    id: e.id,
    status: e.status,
    course: e.course
      ? {
          name: e.course.name,
          department: e.course.department
            ? {
                name: e.course.department.name,
              }
            : undefined,
        }
      : undefined,
    batch: e.batch
      ? {
          id: e.batch.id,
          batchName: e.batch.batchName,
          timing: e.batch.timing,
          startDate: e.batch.startDate,
          endDate: e.batch.endDate,
        }
      : undefined,
  })) as ScheduleEnrollment[];

  return <ScheduleView initialEnrollments={initialEnrollments} />;
}
