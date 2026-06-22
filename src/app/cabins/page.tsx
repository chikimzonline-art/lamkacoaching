import { db } from '@/lib/db';
import CabinsClient from './cabins-client';

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default async function CabinsPage() {
  const cabins = await db.cabin.findMany({
    where: { status: 'active' },
    orderBy: [{ floor: 'asc' }, { cabinNum: 'asc' }],
    include: {
      bookings: {
        where: { status: 'active' },
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
        },
      },
    },
  });

  // Compute availability status for each cabin
  const now = new Date();
  const cabinsWithAvailability = cabins.map((cabin) => {
    const activeExclusive = cabin.bookings.find((b) => {
      if (b.type !== 'exclusive') return false;
      const startLimit = new Date(b.startDate);
      startLimit.setHours(0, 0, 0, 0);
      if (startLimit > now) return false;
      if (!b.endDate) return true;
      const endLimit = new Date(b.endDate);
      endLimit.setHours(23, 59, 59, 999);
      return endLimit >= now;
    });

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayHourlyBookings = cabin.bookings.filter((b) => {
      if (b.type !== 'hourly') return false;
      const startLimit = new Date(b.startDate);
      startLimit.setHours(0, 0, 0, 0);
      if (startLimit > now) return false;
      if (!b.endDate) {
        return startLimit.getTime() === todayStart.getTime();
      } else {
        const endLimit = new Date(b.endDate);
        endLimit.setHours(23, 59, 59, 999);
        return endLimit >= now;
      }
    });

    return {
      id: cabin.id,
      floor: cabin.floor,
      cabinNum: cabin.cabinNum,
      notes: cabin.notes,
      isOccupied: !!activeExclusive,
      hourlyBookingsToday: todayHourlyBookings.map((b) => ({
        startTime: b.startTime || '',
        endTime: b.endTime || '',
      })),
      activeBookingsCount: cabin.bookings.length,
    };
  });

  // Group cabins by floor
  const floors = [...new Set(cabins.map((c) => c.floor))].sort((a, b) => a - b);
  const cabinsByFloor = floors.map((floorNum) => ({
    floor: floorNum,
    label: formatFloorLabel(floorNum),
    cabins: cabinsWithAvailability.filter((c) => c.floor === floorNum),
  }));

  // Get pricing from settings
  const hourlyRateSetting = await db.setting.findUnique({ where: { key: 'hourly_rate' } });
  const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });

  const hourlyMonthlyRate = hourlyRateSetting ? parseInt(hourlyRateSetting.value, 10) : 1000;
  const monthlyRate = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) : 3000;

  const cabinData = {
    cabins: cabinsWithAvailability,
    cabinsByFloor,
    floors,
    pricing: {
      hourlyMonthlyRate,
      monthlyRate,
    },
    totalCabins: cabins.length,
    availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
  };

  return <CabinsClient initialCabinData={cabinData} />;
}
