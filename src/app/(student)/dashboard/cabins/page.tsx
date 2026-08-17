import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"
import DashboardCabinsClient from "./client"

function formatFloorLabel(floor: number): string {
  const suffixes: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
  const suffix = suffixes[floor] || 'th';
  return `${floor}${suffix} Floor`;
}

export default async function ExploreCabinsPage() {
  const { student } = await requireStudent()

  const getCachedCabins = unstable_cache(
    async () => {
      return await db.cabin.findMany({
        where: { status: "active" },
        orderBy: [{ floor: "asc" }, { cabinNum: "asc" }],
        include: {
          bookings: {
            where: { status: { in: ['active', 'pending_payment'] } },
            select: {
              id: true,
              type: true,
              startDate: true,
              endDate: true,
              startTime: true,
              endTime: true,
              studentId: true,
            },
          },
        },
      })
    },
    ['active-cabins'],
    { revalidate: 60, tags: ['cabins'] }
  )

  const getCachedSettings = unstable_cache(
    async () => {
      return await db.setting.findMany({
        where: {
          key: {
            in: [
              'cabin_registration_fee',
              'cabin_reserved_rate',
              'cabin_morning_shift_rate',
              'cabin_day_shift_rate',
              'cabin_night_shift_rate',
            ],
          },
        },
      })
    },
    ['cabin-settings'],
    { revalidate: 3600, tags: ['settings'] }
  )

  // Execute queries
  const [
    cabins, 
    settings, 
    pastCabinBookingsCount
  ] = await Promise.all([
    getCachedCabins(),
    getCachedSettings(),
    db.booking.count({
      where: {
        studentId: student.id,
        cabinId: { not: '' }
      }
    })
  ]);

  // Filter out cabins the student has already booked
  const bookedCabinIds = student.bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").map(b => b.cabinId)

  // Compute availability status for each cabin
  const now = new Date();
  const cabinsWithAvailability = cabins.map((cabin) => {
    const isBookedByMe = cabin.bookings.some(b => b.studentId === student.id);

    // If the student already has an active booking for this cabin, mark it as occupied for them
    if (bookedCabinIds.includes(cabin.id)) {
      return {
        id: cabin.id,
        floor: cabin.floor,
        cabinNum: cabin.cabinNum,
        notes: cabin.notes,
        isOccupied: true,
        isBookedByMe: true,
        bookedShifts: [],
        hourlyBookingsToday: [],
        activeBookingsCount: cabin.bookings.length,
      }
    }

    const activeReserved = cabin.bookings.find((b) => {
      if (b.type !== 'reserved' && b.type !== 'exclusive' && b.type !== 'monthly') return false;
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
    
    // Find active shift bookings for today or ongoing
    const activeShifts = cabin.bookings.filter((b) => {
      if (!['morning_shift', 'day_shift', 'night_shift', 'hourly'].includes(b.type)) return false;
      const startLimit = new Date(b.startDate);
      startLimit.setHours(0, 0, 0, 0);
      if (startLimit > now) return false;
      if (!b.endDate) {
        return startLimit.getTime() <= todayStart.getTime();
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
      isBookedByMe: isBookedByMe,
      bookedShifts: activeShifts.map(b => b.type),
      hourlyBookingsToday: activeShifts.map((b) => ({
        startTime: b.startTime || '',
        endTime: b.endTime || '',
        type: b.type,
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

  const getSetting = (key: string, def: number) => {
    const s = settings.find((s) => s.key === key);
    return s ? parseInt(s.value, 10) : def;
  };

  const pricing = {
    registrationFee: getSetting('cabin_registration_fee', 500),
    reservedRate: getSetting('cabin_reserved_rate', 1100),
    morningShiftRate: getSetting('cabin_morning_shift_rate', 500),
    dayShiftRate: getSetting('cabin_day_shift_rate', 800),
    nightShiftRate: getSetting('cabin_night_shift_rate', 800),
  };

  // Check if first booking

  const isFirstBooking = pastCabinBookingsCount === 0;

  // Find if they have a pending checkout
  const rawPendingCheckout = student.bookings.find(b => b.status === "pending_payment" && b.paidAmount === 0 && b.cabinId !== '');
  let pendingCheckout: any = null;

  if (rawPendingCheckout) {
    const pCabin = cabins.find(c => c.id === rawPendingCheckout.cabinId);
    if (pCabin) {
      pendingCheckout = {
        id: rawPendingCheckout.id,
        type: rawPendingCheckout.type,
        startDate: rawPendingCheckout.startDate,
        endDate: rawPendingCheckout.endDate,
        totalAmount: rawPendingCheckout.totalAmount,
        cabinInfo: {
          floor: pCabin.floor,
          cabinNum: pCabin.cabinNum
        }
      }
    }
  }

  const data = {
    student: {
      id: student.id,
      name: student.name,
      phone: student.phone,
      email: student.email,
    },
    cabins: cabinsWithAvailability,
    cabinsByFloor,
    floors,
    pricing,
    isFirstBooking,
    pendingCheckout,
    totalCabins: cabins.length,
    availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
  };

  return <DashboardCabinsClient data={data} />
}
