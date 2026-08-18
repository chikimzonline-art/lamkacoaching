import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAllActiveCabinsWithBookings } from '@/lib/db/queries/cabins';

// GET /api/public/cabins - Public: list available cabins grouped by floor
export async function GET() {
  try {
    const cabins = await getAllActiveCabinsWithBookings();

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
      
      const activeShifts = cabin.bookings.filter((b) => {
        if (!['morning_shift', 'day_shift', 'night_shift'].includes(b.type)) return false;
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
        activeShiftsToday: activeShifts.map((b) => ({
          type: b.type,
          startTime: b.startTime,
          endTime: b.endTime,
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
    const settings = await db.setting.findMany({
      where: { key: { in: ['cabin_reserved_rate', 'cabin_morning_shift_rate', 'cabin_day_shift_rate', 'cabin_night_shift_rate'] } }
    });
    
    const getSetting = (key: string, def: number) => {
      const s = settings.find((s) => s.key === key);
      return s ? parseInt(s.value, 10) : def;
    };

    return NextResponse.json(
      {
        cabins: cabinsWithAvailability,
        cabinsByFloor,
        floors,
        pricing: {
          reservedRate: getSetting('cabin_reserved_rate', 1100),
          morningShiftRate: getSetting('cabin_morning_shift_rate', 500),
          dayShiftRate: getSetting('cabin_day_shift_rate', 800),
          nightShiftRate: getSetting('cabin_night_shift_rate', 800),
        },
        totalCabins: cabins.length,
        availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Error fetching public cabins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cabins' },
      { status: 500 }
    );
  }
}

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}
