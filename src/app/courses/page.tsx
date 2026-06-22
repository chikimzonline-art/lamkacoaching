import { db } from '@/lib/db';
import CoursesClient from './courses-client';

export default async function CoursesPage() {
  const departments = await db.department.findMany({
    where: {
      status: 'active',
      name: { not: 'Computer Training' },
    },
    orderBy: { name: 'asc' },
    include: {
      courses: {
        where: { status: 'active' },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          duration: true,
          totalFee: true,
          description: true,
        },
      },
    },
  });

  // Filter out departments with no active courses
  const filteredDepartments = departments.filter((d) => d.courses.length > 0);

  return <CoursesClient initialDepartments={filteredDepartments} />;
}
