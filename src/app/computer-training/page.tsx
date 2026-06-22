import { db } from '@/lib/db';
import ComputerTrainingClient from './computer-training-client';

export default async function ComputerTrainingPage() {
  const department = await db.department.findFirst({
    where: { status: 'active', name: 'Computer Training' },
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

  return <ComputerTrainingClient initialDepartment={department} />;
}
