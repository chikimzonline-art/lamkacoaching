import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../domain/cabin_entity.dart';

class FloorFilterTabs extends StatelessWidget {
  final List<FloorGroupEntity> floorGroups;
  final int? selectedFloor;
  final ValueChanged<int?> onFloorSelected;

  const FloorFilterTabs({
    super.key,
    required this.floorGroups,
    required this.selectedFloor,
    required this.onFloorSelected,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          // All Floors Pill
          _FilterChip(
            label: 'All Floors',
            isSelected: selectedFloor == null,
            onTap: () => onFloorSelected(null),
            isDark: isDark,
          ),
          const SizedBox(width: 6),
          ...floorGroups.map((group) {
            final isSelected = selectedFloor == group.floor;
            return Padding(
              padding: const EdgeInsets.only(right: 6),
              child: _FilterChip(
                icon: LucideIcons.building2,
                label: group.label,
                badgeCount: group.availableCount,
                isSelected: isSelected,
                onTap: () => onFloorSelected(group.floor),
                isDark: isDark,
              ),
            );
          }),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final IconData? icon;
  final String label;
  final int? badgeCount;
  final bool isSelected;
  final VoidCallback onTap;
  final bool isDark;

  const _FilterChip({
    this.icon,
    required this.label,
    this.badgeCount,
    required this.isSelected,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF059669)
              : (isDark ? const Color(0xFF1E293B) : Colors.white),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF059669)
                : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF059669).withValues(alpha: 0.2),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(
                icon,
                size: 13,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : const Color(0xFF64748B)),
              ),
              const SizedBox(width: 4),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected
                    ? Colors.white
                    : (isDark ? Colors.white70 : const Color(0xFF475569)),
              ),
            ),
            if (badgeCount != null) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withValues(alpha: 0.2)
                      : (badgeCount! > 0
                          ? const Color(0xFFD1FAE5)
                          : const Color(0xFFFEE2E2)),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$badgeCount free',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: isSelected
                        ? Colors.white
                        : (badgeCount! > 0
                            ? const Color(0xFF065F46)
                            : const Color(0xFF991B1B)),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
