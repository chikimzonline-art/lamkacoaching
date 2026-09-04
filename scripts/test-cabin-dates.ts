import {
  getCalendarMonthEndDate,
  formatDateToYYYYMMDD,
  parseYYYYMMDD,
  calculateCabinPricing,
  getBookingCycleStatus,
  isBookingInGracePeriod,
  isBookingPastGracePeriod,
  isBookingCurrentlyBlocking,
} from '../src/lib/helpers/cabin-dates';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

console.log('Running cabin dates & pricing tests...');

// 1. September end date
const sept = getCalendarMonthEndDate(parseYYYYMMDD('2026-09-04'));
assert(formatDateToYYYYMMDD(sept) === '2026-09-30', 'September end date should be 2026-09-30');
assert(sept.getDate() === 30, 'September last day should be 30');
console.log('✓ Test 1: September 30 end date calculated correctly');

// 2. August end date
const aug = getCalendarMonthEndDate(parseYYYYMMDD('2026-08-15'));
assert(formatDateToYYYYMMDD(aug) === '2026-08-31', 'August end date should be 2026-08-31');
console.log('✓ Test 2: August 31 end date calculated correctly');

// 3. February leap vs non-leap
const feb2026 = getCalendarMonthEndDate(parseYYYYMMDD('2026-02-10'));
assert(formatDateToYYYYMMDD(feb2026) === '2026-02-28', '2026 Feb end date should be 2026-02-28');
const feb2028 = getCalendarMonthEndDate(parseYYYYMMDD('2028-02-05'));
assert(formatDateToYYYYMMDD(feb2028) === '2028-02-29', '2028 Feb end date should be 2028-02-29');
console.log('✓ Test 3: Leap & non-leap February end dates verified');

// 4. Timezone safe format and parse
const dateStr = '2026-09-18';
const parsed = parseYYYYMMDD(dateStr);
assert(parsed.getDate() === 18, 'Parsed date should be 18');
assert(formatDateToYYYYMMDD(parsed) === dateStr, 'Formatted date should match original');
console.log('✓ Test 4: Timezone-safe date formatting and parsing verified');

// 5. Full fee <= 15th
const p1 = calculateCabinPricing({
  startDate: parseYYYYMMDD('2026-09-04'),
  baseRate: 800,
  registrationFee: 500,
  isRegistrationWaived: true,
});
assert(!p1.isSecondHalf, 'Should not be second half');
assert(p1.deskFee === 800, 'Desk fee should be 800');
assert(formatDateToYYYYMMDD(p1.endDate) === '2026-09-30', 'End date should be 2026-09-30');
console.log('✓ Test 5: Full fee on or before 15th verified');

// 6. 50% Mid-month fee > 15th
const p2 = calculateCabinPricing({
  startDate: parseYYYYMMDD('2026-09-18'),
  baseRate: 800,
  registrationFee: 500,
  isRegistrationWaived: true,
});
assert(p2.isSecondHalf, 'Should be second half');
assert(p2.deskFee === 400, 'Desk fee should be 400 (50%)');
assert(formatDateToYYYYMMDD(p2.endDate) === '2026-09-30', 'End date should be 2026-09-30');
console.log('✓ Test 6: 50% mid-month fee after 15th verified');

// 7. Grace period
const augEnd = parseYYYYMMDD('2026-08-31');
augEnd.setHours(23, 59, 59, 999);
const sept3 = parseYYYYMMDD('2026-09-03');
assert(isBookingInGracePeriod(augEnd, sept3) === true, 'Sept 3 is within grace period');
const sept8 = parseYYYYMMDD('2026-09-08');
assert(isBookingPastGracePeriod(augEnd, sept8) === true, 'Sept 8 is past grace period');
console.log('✓ Test 7: 7-day grace period logic verified');

// 8. Lifecycle
const active = { status: 'active', startDate: '2026-08-01', endDate: augEnd };
assert(getBookingCycleStatus(active, sept3) === 'in_grace_period', 'Status is in_grace_period');
assert(getBookingCycleStatus(active, sept8) === 'needs_cycle_update', 'Status is needs_cycle_update');
console.log('✓ Test 8: Booking cycle statuses verified');

// 9. Desk blocking
assert(isBookingCurrentlyBlocking({ status: 'active', startDate: '2026-09-01' }) === true, 'Active blocks');
assert(isBookingCurrentlyBlocking({ status: 'expired', startDate: '2026-08-01' }) === false, 'Expired does not block');
console.log('✓ Test 9: Desk blocking rules verified');

console.log('\nAll automated tests passed successfully!');
