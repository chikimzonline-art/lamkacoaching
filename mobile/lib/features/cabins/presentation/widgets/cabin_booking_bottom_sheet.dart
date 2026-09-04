import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

import '../../../../core/utils/formatters.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../../auth/presentation/controllers/auth_state.dart';
import '../../domain/cabin_entity.dart';
import '../controllers/booking_checkout_notifier.dart';

class CabinBookingBottomSheet extends ConsumerWidget {
  final CabinEntity cabin;
  final CabinPricingEntity pricing;
  final bool isFirstBooking;
  final VoidCallback onBookingSuccess;

  const CabinBookingBottomSheet({
    super.key,
    required this.cabin,
    required this.pricing,
    required this.isFirstBooking,
    required this.onBookingSuccess,
  });

  static Future<void> show(
    BuildContext context, {
    required CabinEntity cabin,
    required CabinPricingEntity pricing,
    required bool isFirstBooking,
    required VoidCallback onBookingSuccess,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CabinBookingBottomSheet(
        cabin: cabin,
        pricing: pricing,
        isFirstBooking: isFirstBooking,
        onBookingSuccess: onBookingSuccess,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final checkoutState = ref.watch(bookingCheckoutNotifierProvider);
    final checkoutNotifier = ref.read(bookingCheckoutNotifierProvider.notifier);
    final authState = ref.watch(authNotifierProvider);

    final isDark = Theme.of(context).brightness == Brightness.dark;

    final selectedShift = checkoutState.selectedShift;
    final startDate = checkoutState.startDate;
    final isProcessing = checkoutState.isProcessing;

    final isSecondHalf = startDate.day > 15;
    final baseFee = pricing.rateForShift(selectedShift);
    final monthlyFee = isSecondHalf ? (baseFee ~/ 2) : baseFee;
    final regFee = isFirstBooking ? pricing.registrationFee : 0;
    final totalDue = monthlyFee + regFee;
    final monthEnd = DateTime(startDate.year, startDate.month + 1, 0);

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.9,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.2),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Cabin Info Header
              Container(
                padding: const EdgeInsets.only(bottom: 14),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF059669),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${cabin.cabinNum}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Cabin ${cabin.cabinNum} on ${cabin.floorLabel}',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              const Icon(LucideIcons.building2, size: 12, color: Color(0xFF059669)),
                              const SizedBox(width: 4),
                              Text(
                                '${cabin.floorLabel} • Available',
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF059669),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Select Shift Heading
              Text(
                'SELECT SHIFT',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.8,
                  color: isDark ? Colors.white60 : const Color(0xFF475569),
                ),
              ),
              const SizedBox(height: 8),

              // 2x2 Shift Grid
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: _ShiftButton(
                            title: 'Exclusive Reserved',
                            subtitle: '24/7 Access',
                            isSelected: selectedShift == 'reserved',
                            isDisabled: cabin.bookedShifts.isNotEmpty,
                            onTap: () => checkoutNotifier.selectShift(
                              'reserved',
                              pricing,
                              isFirstBooking,
                            ),
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: _ShiftButton(
                            title: 'Morning Shift',
                            subtitle: '5AM - 10AM',
                            isSelected: selectedShift == 'morning_shift',
                            isDisabled: cabin.bookedShifts.contains('morning_shift'),
                            onTap: () => checkoutNotifier.selectShift(
                              'morning_shift',
                              pricing,
                              isFirstBooking,
                            ),
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: _ShiftButton(
                            title: 'Day Shift',
                            subtitle: '10AM - 5PM',
                            isSelected: selectedShift == 'day_shift',
                            isDisabled: cabin.bookedShifts.contains('day_shift'),
                            onTap: () => checkoutNotifier.selectShift(
                              'day_shift',
                              pricing,
                              isFirstBooking,
                            ),
                            isDark: isDark,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: _ShiftButton(
                            title: 'Night Shift',
                            subtitle: '5PM - 12AM',
                            isSelected: selectedShift == 'night_shift',
                            isDisabled: cabin.bookedShifts.contains('night_shift'),
                            onTap: () => checkoutNotifier.selectShift(
                              'night_shift',
                              pricing,
                              isFirstBooking,
                            ),
                            isDark: isDark,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              // Date Picker & Duration Row
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'START DATE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: isDark ? Colors.white60 : const Color(0xFF475569),
                          ),
                        ),
                        const SizedBox(height: 6),
                        GestureDetector(
                          onTap: isProcessing
                              ? null
                              : () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: startDate,
                                    firstDate: DateTime.now(),
                                    lastDate: DateTime.now().add(const Duration(days: 90)),
                                  );
                                  if (picked != null) {
                                    checkoutNotifier.setStartDate(picked, pricing, isFirstBooking);
                                  }
                                },
                          child: Container(
                            height: 44,
                            padding: const EdgeInsets.symmetric(horizontal: 12),
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1E293B) : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(LucideIcons.calendar, size: 16, color: Color(0xFF059669)),
                                const SizedBox(width: 8),
                                Text(
                                  DateFormat('dd MMM yyyy').format(startDate),
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'DURATION',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                            color: isDark ? Colors.white60 : const Color(0xFF475569),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          height: 44,
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.5) : const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                            ),
                          ),
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Until ${DateFormat('dd MMM').format(monthEnd)} (Month End)',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white70 : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),

              // Estimated Cost Breakdown
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF064E3B).withValues(alpha: 0.2) : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Shift Desk Fee',
                              style: TextStyle(
                                fontSize: 12,
                                color: isDark ? Colors.white70 : const Color(0xFF475569),
                              ),
                            ),
                            if (isSecondHalf) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEF3C7),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  '50% Mid-Month',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF92400E),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                        Text(
                          Formatters.formatPaiseToRupees(monthlyFee),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                      ],
                    ),
                    if (isFirstBooking) ...[
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'One-Time Registration Fee',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? Colors.white70 : const Color(0xFF475569),
                            ),
                          ),
                          Text(
                            Formatters.formatPaiseToRupees(regFee),
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              Text(
                                'Registration Fee',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? Colors.white70 : const Color(0xFF475569),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFD1FAE5),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Waived (3-Mo Validity)',
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF065F46),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Text(
                            '₹0',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF059669),
                            ),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    Divider(
                      height: 1,
                      color: isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Total Due Today',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF065F46),
                          ),
                        ),
                        Text(
                          Formatters.formatPaiseToRupees(totalDue),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF047857),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),

              // Calendar Month Policy & 7-Day Renewal Grace Box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.calendarClock,
                      size: 14,
                      color: isDark ? Colors.white60 : const Color(0xFF64748B),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Calendar-Month Cycle: Fees paid in advance. 7-calendar-day renewal grace period at month-end to secure your desk.',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark ? Colors.white60 : const Color(0xFF64748B),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),

              // 10-Minute Hold Warning Box
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                ),
                child: const Row(
                  children: [
                    Icon(LucideIcons.clock, size: 15, color: Color(0xFFD97706)),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Reserves this cabin temporarily for 10 minutes while you complete payment.',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF92400E),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Error banner if any
              if (checkoutState.errorMessage != null) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.alertCircle, size: 16, color: Color(0xFFDC2626)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          checkoutState.errorMessage!,
                          style: const TextStyle(fontSize: 11, color: Color(0xFF991B1B)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 18),

              // Primary Action Button
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: isProcessing
                      ? null
                      : () async {
                          final user = (authState is Authenticated) ? authState.user : null;
                          final success = await checkoutNotifier.proceedToPayment(
                            studentId: user?.id ?? 'student_guest',
                            studentName: user?.name ?? 'Student',
                            studentPhone: user?.phone ?? '',
                            studentEmail: user?.email,
                          );

                          if (success && context.mounted) {
                            Navigator.of(context).pop();
                            onBookingSuccess();
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: isProcessing
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 10),
                            Text(
                              'Reserving & Launching Payment...',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Proceed to Payment (${Formatters.formatPaiseToRupees(totalDue)})',
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(LucideIcons.arrowRight, size: 16),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShiftButton extends StatelessWidget {
  final String title;
  final String subtitle;
  final bool isSelected;
  final bool isDisabled;
  final VoidCallback onTap;
  final bool isDark;

  const _ShiftButton({
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.isDisabled,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isDisabled ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? (isDark ? const Color(0xFF064E3B) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF10B981)
                : Colors.transparent,
            width: isSelected ? 1.5 : 1,
          ),
          boxShadow: isSelected && !isDark
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Opacity(
          opacity: isDisabled ? 0.35 : 1.0,
          child: Column(
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
                  decoration: isDisabled ? TextDecoration.lineThrough : null,
                  color: isSelected
                      ? (isDark ? Colors.white : const Color(0xFF065F46))
                      : (isDark ? Colors.white70 : const Color(0xFF475569)),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.normal,
                  color: isSelected
                      ? (isDark ? const Color(0xFF6EE7B7) : const Color(0xFF059669))
                      : (isDark ? Colors.white38 : const Color(0xFF94A3B8)),
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
