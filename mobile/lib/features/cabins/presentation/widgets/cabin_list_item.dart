import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/cabin_entity.dart';

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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Color cardBg;
    Color borderColor;
    Color boxBg;
    Color boxText;
    Color badgeBg;
    Color badgeText;
    String badgeLabel;

    if (cabin.isBookedByMe) {
      cardBg = isDark ? const Color(0xFF3B0764).withValues(alpha: 0.3) : const Color(0xFFFAF5FF);
      borderColor = isDark ? const Color(0xFF7E22CE) : const Color(0xFFC084FC);
      boxBg = const Color(0xFF9333EA);
      boxText = Colors.white;
      badgeBg = const Color(0xFFF3E8FF);
      badgeText = const Color(0xFF7E22CE);
      badgeLabel = 'Your Booking';
    } else if (cabin.isOccupied) {
      cardBg = isDark ? const Color(0xFF1E293B).withValues(alpha: 0.5) : const Color(0xFFF8FAFC);
      borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
      boxBg = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
      boxText = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);
      badgeBg = isDark ? const Color(0xFF450A0A).withValues(alpha: 0.3) : const Color(0xFFFEE2E2);
      badgeText = const Color(0xFFDC2626);
      badgeLabel = 'Occupied';
    } else if (isSelected) {
      cardBg = isDark ? const Color(0xFF064E3B).withValues(alpha: 0.3) : const Color(0xFFECFDF5);
      borderColor = const Color(0xFF10B981);
      boxBg = const Color(0xFF059669);
      boxText = Colors.white;
      badgeBg = const Color(0xFFD1FAE5);
      badgeText = const Color(0xFF047857);
      badgeLabel = 'Selected';
    } else {
      cardBg = isDark ? const Color(0xFF1E293B) : Colors.white;
      borderColor = isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0);
      boxBg = isDark ? const Color(0xFF064E3B).withValues(alpha: 0.5) : const Color(0xFFD1FAE5);
      boxText = const Color(0xFF047857);
      badgeBg = const Color(0xFFD1FAE5);
      badgeText = const Color(0xFF047857);
      badgeLabel = 'Available';
    }

    final isInteractive = !cabin.isOccupied && !cabin.isBookedByMe;

    return Opacity(
      opacity: cabin.isOccupied && !cabin.isBookedByMe ? 0.65 : 1.0,
      child: GestureDetector(
        onTap: isInteractive ? onSelect : null,
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: cardBg,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isSelected ? const Color(0xFF10B981) : borderColor,
              width: isSelected ? 2 : 1,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: const Color(0xFF10B981).withValues(alpha: 0.15),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    )
                  ]
                : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Number Box
                  Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(
                      color: boxBg,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      '${cabin.cabinNum}',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: boxText,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),

                  // Cabin Title & Floor
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Cabin ${cabin.cabinNum}',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            if (showFloorLabel) ...[
                              const SizedBox(width: 6),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    LucideIcons.building2,
                                    size: 11,
                                    color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                                  ),
                                  const SizedBox(width: 2),
                                  Text(
                                    cabin.floorLabel,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 2),
                        if (!cabin.isOccupied && !cabin.isBookedByMe)
                          Text(
                            'Available · ${cabin.floorLabel}',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFF059669),
                            ),
                          )
                        else if (cabin.notes != null && cabin.notes!.isNotEmpty)
                          Text(
                            cabin.notes!,
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                            ),
                          ),
                      ],
                    ),
                  ),

                  // Trailing Status Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      badgeLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: badgeText,
                      ),
                    ),
                  ),
                ],
              ),

              // Active Booked Shifts List
              if (!cabin.isOccupied && cabin.activeShiftsToday.isNotEmpty) ...[
                const SizedBox(height: 8),
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: [
                      Text(
                        'Booked today:',
                        style: TextStyle(
                          fontSize: 10,
                          color: isDark ? Colors.white54 : const Color(0xFF64748B),
                        ),
                      ),
                      ...cabin.activeShiftsToday.map((shift) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${shift.type.replaceAll('_', ' ')} (${shift.startTime} - ${shift.endTime})',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w500,
                              color: Color(0xFFBE123C),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
