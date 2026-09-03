import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/cabin_entity.dart';

/// Redesigned Cabin Card matching Wireframe 1 with live shift availability matrix,
/// floor tagging, and one-tap reservation trigger.
class CabinListItem extends StatelessWidget {
  final CabinEntity cabin;
  final bool isSelected;
  final bool showFloorLabel;
  final VoidCallback onSelect;

  const CabinListItem({
    super.key,
    required this.cabin,
    this.isSelected = false,
    this.showFloorLabel = true,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final isBookedByMe = cabin.isBookedByMe;
    final isFullyBooked = cabin.isFullyBooked;
    final isInteractive = !isFullyBooked && !isBookedByMe;

    // Determine status badge
    Color badgeBg;
    Color badgeText;
    String badgeLabel;

    if (isBookedByMe) {
      badgeBg = isDark
          ? const Color(0xFF581C87).withValues(alpha: 0.4)
          : const Color(0xFFF3E8FF);
      badgeText = const Color(0xFF9333EA);
      badgeLabel = 'Your Desk';
    } else if (isFullyBooked) {
      badgeBg = isDark
          ? const Color(0xFF7F1D1D).withValues(alpha: 0.3)
          : const Color(0xFFFEE2E2);
      badgeText = const Color(0xFFDC2626);
      badgeLabel = 'Fully Booked';
    } else if (cabin.freeShiftsCount == 3) {
      badgeBg = isDark
          ? const Color(0xFF064E3B).withValues(alpha: 0.4)
          : const Color(0xFFD1FAE5);
      badgeText = const Color(0xFF059669);
      badgeLabel = '🟢 All Shifts Free';
    } else {
      badgeBg = isDark
          ? const Color(0xFF78350F).withValues(alpha: 0.3)
          : const Color(0xFFFEF3C7);
      badgeText = const Color(0xFFD97706);
      badgeLabel = '🟡 ${cabin.freeShiftsCount} Shifts Free';
    }

    // Border & card surface
    final cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
    final borderColor = isSelected
        ? const Color(0xFF10B981)
        : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0));

    return Opacity(
      opacity: isFullyBooked && !isBookedByMe ? 0.65 : 1.0,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: borderColor,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: InkWell(
          onTap: isInteractive ? onSelect : null,
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Header: Number Avatar + Title + Floor + Status Badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isBookedByMe
                            ? const Color(0xFF9333EA)
                            : (isFullyBooked
                                ? (isDark
                                    ? const Color(0xFF334155)
                                    : const Color(0xFFCBD5E1))
                                : const Color(0xFF059669)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${cabin.cabinNum}',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Cabin ${cabin.cabinNum}',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF0F172A),
                            ),
                          ),
                          const SizedBox(height: 2),
                          Row(
                            children: [
                              Icon(
                                LucideIcons.building2,
                                size: 12,
                                color: isDark
                                    ? Colors.white38
                                    : const Color(0xFF94A3B8),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                cabin.floorLabel,
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                  color: isDark
                                      ? Colors.white54
                                      : const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: badgeBg,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        badgeLabel,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: badgeText,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 14),

                // 2. Shift Availability Matrix (Morning, Day, Night)
                Text(
                  'SHIFT AVAILABILITY',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.7,
                    color: isDark
                        ? Colors.white38
                        : const Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    _buildShiftChip(
                      context,
                      label: 'Morning (5AM - 10AM)',
                      isAvailable: cabin.isShiftAvailable('morning_shift'),
                      isDark: isDark,
                    ),
                    _buildShiftChip(
                      context,
                      label: 'Day (10AM - 5PM)',
                      isAvailable: cabin.isShiftAvailable('day_shift'),
                      isDark: isDark,
                    ),
                    _buildShiftChip(
                      context,
                      label: 'Night (5PM - 12AM)',
                      isAvailable: cabin.isShiftAvailable('night_shift'),
                      isDark: isDark,
                    ),
                  ],
                ),

                // Desk Notes / Features
                if (cabin.notes != null && cabin.notes!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        size: 13,
                        color: isDark
                            ? Colors.white38
                            : const Color(0xFF94A3B8),
                      ),
                      const SizedBox(width: 5),
                      Expanded(
                        child: Text(
                          cabin.notes!,
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark
                                ? Colors.white54
                                : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 12),
                const Divider(height: 1, thickness: 0.7),
                const SizedBox(height: 10),

                // 3. Bottom Row: Starting Rate + Reserve Button
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Starting from',
                            style: TextStyle(
                              fontSize: 9,
                              color: isDark
                                  ? Colors.white38
                                  : const Color(0xFF94A3B8),
                            ),
                          ),
                          Text(
                            '₹500 / month',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: isDark
                                  ? const Color(0xFF4EDEA3)
                                  : const Color(0xFF059669),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: isInteractive ? onSelect : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isInteractive
                            ? const Color(0xFF059669)
                            : (isDark
                                ? const Color(0xFF334155)
                                : const Color(0xFFE2E8F0)),
                        foregroundColor:
                            isInteractive ? Colors.white : const Color(0xFF94A3B8),
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        minimumSize: const Size(0, 34),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            isBookedByMe
                                ? 'Your Booking'
                                : (isFullyBooked ? 'Full' : 'Reserve Desk'),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          if (isInteractive) ...[
                            const SizedBox(width: 4),
                            const Icon(Icons.arrow_forward_rounded, size: 13),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildShiftChip(
    BuildContext context, {
    required String label,
    required bool isAvailable,
    required bool isDark,
  }) {
    final bg = isAvailable
        ? (isDark
            ? const Color(0xFF064E3B).withValues(alpha: 0.3)
            : const Color(0xFFECFDF5))
        : (isDark
            ? const Color(0xFF7F1D1D).withValues(alpha: 0.2)
            : const Color(0xFFFEF2F2));

    final fg = isAvailable
        ? const Color(0xFF059669)
        : (isDark ? const Color(0xFFF87171) : const Color(0xFFDC2626));

    final border = isAvailable
        ? const Color(0xFF10B981).withValues(alpha: 0.3)
        : const Color(0xFFEF4444).withValues(alpha: 0.25);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isAvailable ? Icons.check_circle_rounded : Icons.cancel_rounded,
            size: 11,
            color: fg,
          ),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: fg,
              decoration: isAvailable ? null : TextDecoration.lineThrough,
            ),
          ),
        ],
      ),
    );
  }
}
