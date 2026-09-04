/**
 * Helper utilities for study cabin calendar-month lifecycles,
 * tiered mid-month pricing, registration fee validity, and 7-day grace periods.
 */

export const CABIN_RENEWAL_GRACE_DAYS = 7;
export const REGISTRATION_VALIDITY_DAYS = 90; // 3 months

export type BookingCycleStatus =
  | 'active_current'
  | 'in_grace_period'
  | 'needs_cycle_update'
  | 'expired'
  | 'pending_payment';

/**
 * Returns the exact last millisecond of the calendar month for a given start date.
 * E.g., for Feb 12, 2026 -> Feb 28, 2026 23:59:59.999 (or Feb 29 in leap years).
 * For Sept 4, 2026 -> Sept 30, 2026 23:59:59.999.
 */
export function getCalendarMonthEndDate(startDate: Date): Date {
  const year = startDate.getFullYear();
  const month = startDate.getMonth(); // 0-indexed
  // Day 0 of next month is the last day of this month
  const lastDay = new Date(year, month + 1, 0);
  lastDay.setHours(23, 59, 59, 999);
  return lastDay;
}

/**
 * Returns the end date of the renewal grace period (default 7 calendar days after endDate).
 * E.g., if endDate is August 31, graceEnd is September 7 at 23:59:59.999.
 */
export function getGracePeriodEndDate(endDate: Date, graceDays = CABIN_RENEWAL_GRACE_DAYS): Date {
  const graceEnd = new Date(endDate);
  graceEnd.setDate(graceEnd.getDate() + graceDays);
  graceEnd.setHours(23, 59, 59, 999);
  return graceEnd;
}

/**
 * Determines the lifecycle status of a booking:
 * - 'pending_payment': booking initiated but payment pending
 * - 'expired': explicitly expired or cancelled
 * - 'active_current': active and within its current month/cycle
 * - 'in_grace_period': active and within the 7-day renewal grace period after endDate
 * - 'needs_cycle_update': active offline student whose endDate ended >7 days ago (needs admin reconciliation)
 */
export function getBookingCycleStatus(
  booking: {
    status: string;
    startDate: Date | string;
    endDate?: Date | string | null;
  },
  now = new Date(),
  graceDays = CABIN_RENEWAL_GRACE_DAYS
): BookingCycleStatus {
  if (booking.status === 'pending_payment') {
    return 'pending_payment';
  }
  if (booking.status === 'expired' || booking.status === 'cancelled') {
    return 'expired';
  }
  if (booking.status !== 'active') {
    return 'expired';
  }

  if (!booking.endDate) {
    return 'active_current';
  }

  const end = typeof booking.endDate === 'string' ? new Date(booking.endDate) : booking.endDate;
  if (now <= end) {
    return 'active_current';
  }

  const graceEnd = getGracePeriodEndDate(end, graceDays);
  if (now <= graceEnd) {
    return 'in_grace_period';
  }

  // Active in database, but endDate is past the 7-day grace window
  return 'needs_cycle_update';
}

/**
 * Checks if a booking is currently in its renewal grace period.
 */
export function isBookingInGracePeriod(
  endDate: Date | string | null,
  now = new Date(),
  graceDays = CABIN_RENEWAL_GRACE_DAYS
): boolean {
  if (!endDate) return false;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const graceEnd = getGracePeriodEndDate(end, graceDays);
  return now > end && now <= graceEnd;
}

/**
 * Checks if a booking's endDate is past the renewal grace period (7 days).
 */
export function isBookingPastGracePeriod(
  endDate: Date | string | null,
  now = new Date(),
  graceDays = CABIN_RENEWAL_GRACE_DAYS
): boolean {
  if (!endDate) return false;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  const graceEnd = getGracePeriodEndDate(end, graceDays);
  return now > graceEnd;
}

/**
 * Determines whether a booking currently occupies / blocks a desk or shift.
 * A booking blocks if:
 * 1. It is 'pending_payment' (temporary hold during checkout)
 * 2. It is 'active' (whether current, in grace period, or needing cycle update)
 * An 'expired' or 'cancelled' booking NEVER blocks.
 */
export function isBookingCurrentlyBlocking(
  booking: {
    status: string;
    startDate: Date | string;
    endDate?: Date | string | null;
  }
): boolean {
  return booking.status === 'active' || booking.status === 'pending_payment';
}

/**
 * Checks if a student's one-time registration fee is waived based on prior booking history.
 * If the student had a booking within the past 90 days (3 months), the fee is waived.
 */
export function isRegistrationFeeWaived(
  priorBookings: Array<{
    createdAt: Date | string;
    endDate?: Date | string | null;
    status: string;
  }>,
  targetStartDate = new Date()
): boolean {
  if (!priorBookings || priorBookings.length === 0) {
    return false;
  }

  const ninetyDaysAgo = new Date(targetStartDate);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - REGISTRATION_VALIDITY_DAYS);

  return priorBookings.some((b) => {
    // Count real bookings (active, completed, cancelled, or expired)
    if (!['active', 'completed', 'cancelled', 'expired'].includes(b.status)) {
      return false;
    }
    const end = b.endDate ? (typeof b.endDate === 'string' ? new Date(b.endDate) : b.endDate) : null;
    const created = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt;

    if (end && end >= ninetyDaysAgo) {
      return true;
    }
    if (created >= ninetyDaysAgo) {
      return true;
    }
    return false;
  });
}

/**
 * Calculates pricing for a cabin booking:
 * - Join on or before 15th: 100% desk fee
 * - Join after 15th: 50% desk fee
 * - Registration fee: 100% if not waived, ₹0 if waived (within 3 months)
 */
export function calculateCabinPricing({
  startDate,
  baseRate,
  registrationFee,
  isRegistrationWaived = false,
}: {
  startDate: Date;
  baseRate: number;
  registrationFee: number;
  isRegistrationWaived?: boolean;
}) {
  const isSecondHalf = startDate.getDate() > 15;
  const deskFee = isSecondHalf ? Math.round(baseRate / 2) : baseRate;
  const registrationFeeCharged = isRegistrationWaived ? 0 : registrationFee;
  const totalAmount = deskFee + registrationFeeCharged;

  return {
    isSecondHalf,
    baseRate,
    deskFee,
    registrationFeeCharged,
    isRegistrationWaived,
    totalAmount,
    totalAmountInPaise: Math.round(totalAmount * 100),
    endDate: getCalendarMonthEndDate(startDate),
  };
}

/**
 * Safely formats a local Date to 'YYYY-MM-DD' without UTC shift.
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely parses a 'YYYY-MM-DD' string into local Date midnight.
 */
export function parseYYYYMMDD(dateStr: string): Date {
  if (!dateStr) return new Date();
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return new Date();
  return new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
}
