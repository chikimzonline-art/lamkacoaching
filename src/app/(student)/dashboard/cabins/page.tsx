import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { unstable_cache } from "next/cache"
import DashboardCabinsClient from "./client"
import {
  isBookingCurrentlyBlocking,
  isRegistrationFeeWaived,
  getCalendarMonthEndDate,
} from "@/lib/helpers/cabin-dates"

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
              status: true,
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
    studentPastBookings
  ] = await Promise.all([
    getCachedCabins(),
    getCachedSettings(),
    db.booking.findMany({
      where: {
        studentId: student.id,
        cabinId: { not: '' }
      },
      select: {
        createdAt: true,
        endDate: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  ]);

  // Filter out cabins the student has already booked
  const bookedCabinIds = student.bookings.filter(b => b.status !== "completed" && b.status !== "cancelled").map(b => b.cabinId)

  // Compute availability status for each cabin
  const now = new Date();
  const isRegistrationWaived = isRegistrationFeeWaived(studentPastBookings, now);
  const monthEndDate = getCalendarMonthEndDate(now);
  const isSecondHalf = now.getDate() > 15;

  const cabinsWithAvailability = cabins.map((cabin) => {
    const isBookedByMe = bookedCabinIds.includes(cabin.id);

    // If the student already has an active booking for this cabin, mark it as occupied for them
    if (isBookedByMe) {
      return {
        id: cabin.id,
        floor: cabin.floor,
        cabinNum: cabin.cabinNum,
        notes: cabin.notes,
        isOccupied: true,
        isBookedByMe: true,
        bookedShifts: [],
        activeShiftsToday: [],
        activeBookingsCount: cabin.bookings.length,
      }
    }

    const activeReserved = cabin.bookings.find((b) => {
      if (b.type !== 'reserved') return false;
      return isBookingCurrentlyBlocking(b);
    });
    
    // Find active shift bookings for today or ongoing
    const activeShifts = cabin.bookings.filter((b) => {
      if (!['morning_shift', 'day_shift', 'night_shift'].includes(b.type)) return false;
      return isBookingCurrentlyBlocking(b);
    });

    const isOccupied = !!activeReserved || activeShifts.length >= 3;

    return {
      id: cabin.id,
      floor: cabin.floor,
      cabinNum: cabin.cabinNum,
      notes: cabin.notes,
      isOccupied,
      isBookedByMe: isBookedByMe,
      bookedShifts: activeShifts.map(b => b.type),
      activeShiftsToday: activeShifts.map((b) => ({
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

  const isFirstBooking = !isRegistrationWaived;

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
    isRegistrationWaived,
    isSecondHalf,
    monthEndDate: monthEndDate.toISOString(),
    pendingCheckout,
    totalCabins: cabins.length,
    availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
  };

  return <DashboardCabinsClient data={data} />
}
