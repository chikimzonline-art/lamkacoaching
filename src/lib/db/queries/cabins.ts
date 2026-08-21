import { db } from '@/lib/db';

export const getAllCabinsForAdmin = () => {
  return db.cabin.findMany({
    orderBy: [{ floor: 'asc' }, { cabinNum: 'asc' }],
    include: {
      bookings: {
        where: { 
          status: { in: ['active', 'pending_payment'] },
          type: { in: ['reserved', 'morning_shift', 'day_shift', 'night_shift'] }
        },
        select: {
          id: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          student: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });
};

export const getAllActiveCabinsWithBookings = () => {
  return db.cabin.findMany({
    where: { status: 'active' },
    orderBy: [{ floor: 'asc' }, { cabinNum: 'asc' }],
    include: {
      bookings: {
        where: { 
          status: { in: ['active', 'pending_payment'] },
          type: { in: ['reserved', 'morning_shift', 'day_shift', 'night_shift'] }
        },
        select: {
          id: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          student: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });
};

export const getCabinById = (id: string) => {
  return db.cabin.findUnique({
    where: { id },
    include: {
      bookings: {
        where: { 
          status: { in: ['active', 'pending_payment'] },
          type: { in: ['reserved', 'morning_shift', 'day_shift', 'night_shift'] }
        },
        select: {
          id: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          student: { select: { id: true, name: true, phone: true } },
        },
      }
    }
  });
};
