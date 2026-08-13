"use server"

import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Client } from "@upstash/workflow"

export async function bookCabin(cabinId: string, bookingType: 'reserved' | 'morning_shift' | 'day_shift' | 'night_shift', startDateStr: string) {
  const { student } = await requireStudent()

  // Check if student already has a pending cabin booking
  const existingPendingBooking = await db.booking.findFirst({
    where: {
      studentId: student.id,
      status: "pending_payment",
      cabinId: { not: '' }
    }
  })

  if (existingPendingBooking) {
    throw new Error("You already have a pending cabin booking. Please cancel it or complete the payment first.")
  }

  // Find the cabin and its active bookings
  const cabin = await db.cabin.findUnique({
    where: { id: cabinId },
    include: {
      bookings: {
        where: { status: "active" }
      }
    }
  })

  if (!cabin) {
    throw new Error("Cabin not found.")
  }

  // Ensure availability
  const startDate = new Date(startDateStr)
  startDate.setHours(0, 0, 0, 0)
  const now = new Date()

  if (startDate < new Date(now.setHours(0,0,0,0))) {
    throw new Error("Start date cannot be in the past.")
  }

  // Check if cabin is occupied
  const isOccupied = cabin.bookings.some(b => {
    // If checking against a past date for active bookings, ensure they overlap.
    // For simplicity, any active 'reserved' booking that is currently active or future active overlaps everything.
    const startLimit = new Date(b.startDate);
    startLimit.setHours(0, 0, 0, 0);
    const endLimit = b.endDate ? new Date(b.endDate) : null;
    if (endLimit) endLimit.setHours(23, 59, 59, 999);

    // If the booking ended before our start date, it doesn't overlap
    if (endLimit && endLimit < startDate) return false;

    // Check conflict types
    if (b.type === 'reserved' || b.type === 'exclusive' || b.type === 'monthly') return true;
    if (bookingType === 'reserved') return true; // Can't reserve if there's any active booking (even shifts)
    if (b.type === bookingType) return true; // Can't book the same shift
    return false;
  });

  if (isOccupied) {
    throw new Error("This cabin is not available on the selected date for this shift.")
  }

  // Calculate dates and amounts
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + 1) // Always 1 month duration for now

  // Fetch dynamic pricing
  const settings = await db.setting.findMany({
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
  });

  const getSetting = (key: string, def: number) => {
    const s = settings.find((s) => s.key === key);
    return s ? parseInt(s.value, 10) : def;
  };

  const registrationFee = getSetting('cabin_registration_fee', 500);
  const reservedRate = getSetting('cabin_reserved_rate', 1100);
  const morningShiftRate = getSetting('cabin_morning_shift_rate', 500);
  const dayShiftRate = getSetting('cabin_day_shift_rate', 800);
  const nightShiftRate = getSetting('cabin_night_shift_rate', 800);

  let feePerMonth = 0;
  let startTime = '';
  let endTime = '';

  if (bookingType === 'reserved') {
    feePerMonth = reservedRate;
  } else if (bookingType === 'morning_shift') {
    feePerMonth = morningShiftRate;
    startTime = '05:00';
    endTime = '10:00';
  } else if (bookingType === 'day_shift') {
    feePerMonth = dayShiftRate;
    startTime = '10:00';
    endTime = '17:00';
  } else if (bookingType === 'night_shift') {
    feePerMonth = nightShiftRate;
    startTime = '17:00';
    endTime = '23:59';
  }

  // Check if first booking
  const pastCabinBookingsCount = await db.booking.count({
    where: {
      studentId: student.id,
      cabinId: { not: '' }
    }
  });

  const totalAmount = (feePerMonth + (pastCabinBookingsCount === 0 ? registrationFee : 0)) * 100;

  const newBooking = await db.booking.create({
    data: {
      studentId: student.id,
      cabinId: cabin.id,
      type: bookingType,
      startDate,
      endDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      totalAmount,
      paidAmount: 0,
      status: "pending_payment", // Defer payment
      notes: `Booked via Student Dashboard`
    }
  })

  // Trigger the 10-minute cleanup workflow
  const workflowClient = new Client({ token: process.env.QSTASH_TOKEN! })
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  await workflowClient.trigger({
    url: `${baseUrl}/api/workflow/cleanup-booking`,
    body: { bookingId: newBooking.id }
  })

  revalidatePath("/dashboard/cabins")
  return { success: true, bookingId: newBooking.id }
}

export async function cancelCabinBooking(bookingId: string) {
  const { student } = await requireStudent()

  const booking = await db.booking.findUnique({
    where: { id: bookingId }
  })

  if (!booking || booking.studentId !== student.id) {
    throw new Error("Booking not found or unauthorized.")
  }

  if (booking.status !== "pending_payment") {
    throw new Error("Only pending bookings can be cancelled.")
  }

  await db.booking.delete({
    where: { id: bookingId }
  })

  revalidatePath("/dashboard/history")
  return { success: true }
}
