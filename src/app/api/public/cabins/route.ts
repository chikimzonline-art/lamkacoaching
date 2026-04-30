import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/public/cabins - Public: list available cabins
export async function GET() {
  try {
    const cabins = await db.cabin.findMany({
      where: { status: 'active' },
      orderBy: { cabinNum: 'asc' },
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
      const activeExclusive = cabin.bookings.find(
        (b) => b.type === 'exclusive' && (!b.endDate || new Date(b.endDate) >= now)
      );

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayHourlyBookings = cabin.bookings.filter(
        (b) =>
          b.type === 'hourly' &&
          new Date(b.startDate).getTime() === todayStart.getTime()
      );

      return {
        id: cabin.id,
        cabinNum: cabin.cabinNum,
        notes: cabin.notes,
        isOccupied: !!activeExclusive,
        hourlyBookingsToday: todayHourlyBookings.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
        })),
        activeBookingsCount: cabin.bookings.length,
      };
    });

    // Get pricing from settings
    const hourlyRateSetting = await db.setting.findUnique({ where: { key: 'hourly_rate' } });
    const monthlyRateSetting = await db.setting.findUnique({ where: { key: 'monthly_rate' } });

    const hourlyRate = hourlyRateSetting ? parseInt(hourlyRateSetting.value, 10) : 50;
    const monthlyRate = monthlyRateSetting ? parseInt(monthlyRateSetting.value, 10) : 3000;

    return NextResponse.json({
      cabins: cabinsWithAvailability,
      pricing: {
        hourlyRate,
        monthlyRate,
      },
      totalCabins: cabins.length,
      availableCabins: cabinsWithAvailability.filter((c) => !c.isOccupied).length,
    });
  } catch (error) {
    console.error('Error fetching public cabins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cabins' },
      { status: 500 }
    );
  }
}
