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
    const activeReserved = cabin.bookings.find((b) => {
      if (b.type !== 'reserved') return false;
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
    const todayShiftBookings = cabin.bookings.filter((b) => {
      if (b.type !== 'shift') return false;
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
      isOccupied: !!activeReserved,
      shiftBookingsToday: todayShiftBookings.map((b) => ({
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
  const morningRateSetting = await db.setting.findUnique({ where: { key: 'shift_morning_rate' } });
  const dayRateSetting = await db.setting.findUnique({ where: { key: 'shift_day_rate' } });
  const nightRateSetting = await db.setting.findUnique({ where: { key: 'shift_night_rate' } });
  const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });
  const regFeeSetting = await db.setting.findUnique({ where: { key: 'booking_registration_fee' } });

  const morningRate = morningRateSetting ? parseInt(morningRateSetting.value, 10) : 500;
  const dayRate = dayRateSetting ? parseInt(dayRateSetting.value, 10) : 800;
  const nightRate = nightRateSetting ? parseInt(nightRateSetting.value, 10) : 800;
  const monthlyRate = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) : 3000;
  const regFee = regFeeSetting ? parseInt(regFeeSetting.value, 10) : 500;

  const cabinData = {
    cabins: cabinsWithAvailability,
    cabinsByFloor,
    floors,
    pricing: {
      morningRate,
      dayRate,
      nightRate,
      monthlyRate,
      regFee,
    },
    totalCabins: cabins.length,
    availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
  };

  return <CabinsClient initialCabinData={cabinData} />;
}
