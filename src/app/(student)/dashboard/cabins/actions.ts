"use server";

import { requireStudent } from "@/lib/student-auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { Client } from "@upstash/workflow"
import { env } from "@/env"
import * as Sentry from "@sentry/nextjs"
import {
  isBookingCurrentlyBlocking,
  isRegistrationFeeWaived,
  calculateCabinPricing,
} from "@/lib/helpers/cabin-dates"

import { z } from "zod"

const BookCabinSchema = z.object({
  cabinId: z.string().min(1, "Cabin ID is required"),
  bookingType: z.enum(['reserved', 'morning_shift', 'day_shift', 'night_shift']),
  startDateStr: z.string().min(1, "Start date is required")
})

const CancelCabinSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required")
})

export async function bookCabin(rawCabinId: string, rawBookingType: 'reserved' | 'morning_shift' | 'day_shift' | 'night_shift', rawStartDateStr: string) {
  try {
    const { cabinId, bookingType, startDateStr } = BookCabinSchema.parse({ cabinId: rawCabinId, bookingType: rawBookingType, startDateStr: rawStartDateStr })
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
      return { success: false, error: "You already have a pending cabin booking. Please cancel it or complete the payment first." }
    }

    // Ensure availability dates
    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0)
    const now = new Date()

    if (startDate < new Date(now.setHours(0,0,0,0))) {
      return { success: false, error: "Start date cannot be in the past." }
    }

    const newBooking = await db.$transaction(async (tx) => {
      // Find the cabin and its active bookings INSIDE the transaction
      const cabin = await tx.cabin.findUnique({
        where: { id: cabinId },
        include: {
          bookings: {
            where: { status: { in: ['active', 'pending_payment'] } }
          }
        }
      })

      if (!cabin) {
        throw new Error("Cabin not found.")
      }

      // Check if cabin is occupied
      const isOccupied = cabin.bookings.some(b => {
        if (!isBookingCurrentlyBlocking(b)) return false;
        if (b.type === 'reserved') return true;
        if (bookingType === 'reserved') return true;
        if (b.type === bookingType) return true;
        return false;
      });

      if (isOccupied) {
        throw new Error("This cabin is not available on the selected date for this shift.")
      }

      // Fetch dynamic pricing
      const settings = await tx.setting.findMany({
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

      // Check prior bookings for 90-day registration fee validity
      const priorBookings = await tx.booking.findMany({
        where: {
          studentId: student.id,
          cabinId: { not: '' },
        },
        select: {
          createdAt: true,
          endDate: true,
          status: true,
        },
      });

      const isRegWaived = isRegistrationFeeWaived(priorBookings, startDate);
      const pricingCalc = calculateCabinPricing({
        startDate,
        baseRate: feePerMonth,
        registrationFee,
        isRegistrationWaived: isRegWaived,
      });

      return await tx.booking.create({
        data: {
          studentId: student.id,
          cabinId: cabin.id,
          type: bookingType,
          startDate,
          endDate: pricingCalc.endDate,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          totalAmount: pricingCalc.totalAmountInPaise,
          paidAmount: 0,
          status: "pending_payment", // Defer payment
          notes: `Booked via Student Dashboard${pricingCalc.isSecondHalf ? ' (50% Mid-Month Rate)' : ''}${isRegWaived ? ' (Registration Fee Waived - 3mo Validity)' : ''}`
        }
      })
    })

    // Trigger the 10-minute cleanup workflow
    const workflowClient = new Client({ token: env.QSTASH_TOKEN })
    const baseUrl = env.NEXTAUTH_URL || 'http://localhost:3000'
    
    try {
      await workflowClient.trigger({
        url: `${baseUrl}/api/workflow/cleanup-booking`,
        body: { bookingId: newBooking.id }
      })
    } catch (workflowErr) {
      console.warn('Could not trigger cleanup workflow:', workflowErr);
    }

    revalidatePath("/dashboard/cabins")
    revalidatePath("/cabins")
    return { success: true, bookingId: newBooking.id }
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Booking Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during booking." }
  }
}

export async function cancelCabinBooking(rawBookingId: string) {
  try {
    const { bookingId } = CancelCabinSchema.parse({ bookingId: rawBookingId })
    const { student } = await requireStudent()

    const booking = await db.booking.findUnique({
      where: { id: bookingId }
    })

    if (!booking || booking.studentId !== student.id) {
      return { success: false, error: "Booking not found or unauthorized." }
    }

    if (booking.status !== "pending_payment") {
      return { success: false, error: "Only pending bookings can be cancelled." }
    }

    await db.booking.delete({
      where: { id: bookingId }
    })

    revalidatePath("/dashboard/history")
    revalidatePath("/dashboard/cabins")
    revalidatePath("/cabins")
    return { success: true }
  } catch (error: any) {
    Sentry.captureException(error);
    console.error("Cancel Booking Error:", error);
    return { success: false, error: error.message || "An unexpected error occurred during cancellation." }
  }
}
