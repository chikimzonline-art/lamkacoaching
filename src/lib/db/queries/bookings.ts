import { db } from '@/lib/db';

export const getOverlappingBookings = (cabinId: string, currentEnd: Date, newEnd: Date, ignoreBookingId?: string) => {
  return db.booking.findMany({
    where: {
      cabinId,
      status: { in: ['active', 'pending_payment'] },
      id: ignoreBookingId ? { not: ignoreBookingId } : undefined,
      OR: [
        { startDate: { lte: newEnd }, endDate: { gte: currentEnd } },
        { startDate: { lte: newEnd }, endDate: null },
      ],
    },
  });
};

export const getRecentBookings = (limit: number = 5) => {
  return db.booking.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { 
      student: { select: { id: true, name: true, phone: true } }, 
      cabin: { select: { id: true, cabinNum: true } } 
    }
  });
};

export const getBookingsByStudent = (studentId: string, limit?: number) => {
  return db.booking.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      cabin: { select: { id: true, cabinNum: true } }
    }
  });
};

// Vector 5 fix: Only look at valid booking types
export const getActiveBookingsForCabin = (cabinId: string) => {
  return db.booking.findMany({
    where: {
      cabinId,
      status: { in: ['active', 'pending_payment'] },
      type: { in: ['reserved', 'morning_shift', 'day_shift', 'night_shift'] }
    },
    orderBy: { createdAt: 'asc' }
  });
};

export const getPendingBookings = (limit: number = 5) => {
  return db.booking.findMany({
    where: { status: 'pending' },
    include: {
      student: { select: { name: true, phone: true } },
      cabin: { select: { cabinNum: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};

export const getPendingBookingCount = () => {
  return db.booking.count({ where: { status: 'pending' } });
};
