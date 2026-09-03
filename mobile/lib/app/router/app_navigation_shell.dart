import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/utils/haptic_service.dart';
import '../../features/dashboard/presentation/widgets/quick_pass_action_sheet.dart';
import '../theme/app_colors.dart';

/// Adaptive 4-destination bottom navigation shell with a Paytm-style
/// raised center QR action button docked in the bottom bar.
class AppNavigationShell extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const AppNavigationShell({
    super.key,
    required this.navigationShell,
  });

  void _onTap(int index) {
    HapticService.selectionClick();
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final selectedColor = isDark
        ? const Color(0xFF10B981)
        : const Color(0xFF059669);

    final unselectedColor = isDark
        ? AppColors.darkTextTertiary
        : AppColors.lightTextTertiary;

    final currentIndex = navigationShell.currentIndex;

    return Scaffold(
      body: navigationShell,
      floatingActionButton: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF059669), Color(0xFF10B981)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF059669).withValues(alpha: 0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              HapticService.selectionClick();
              QuickPassActionSheet.show(context);
            },
            borderRadius: BorderRadius.circular(28),
            child: const Icon(
              Icons.qr_code_scanner_rounded,
              color: Colors.white,
              size: 26,
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 6.0,
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        elevation: 8,
        padding: EdgeInsets.zero,
        height: 64,
        child: Row(
          children: [
            // Left pair: Home & Courses
            _buildNavItem(
              index: 0,
              unselectedIcon: Icons.home_outlined,
              selectedIcon: Icons.home_rounded,
              label: 'Home',
              isSelected: currentIndex == 0,
              selectedColor: selectedColor,
              unselectedColor: unselectedColor,
            ),
            _buildNavItem(
              index: 1,
              unselectedIcon: Icons.menu_book_outlined,
              selectedIcon: Icons.menu_book_rounded,
              label: 'Courses',
              isSelected: currentIndex == 1,
              selectedColor: selectedColor,
              unselectedColor: unselectedColor,
            ),

            // Gap for docked center button
            const SizedBox(width: 56),

            // Right pair: Cabins & More
            _buildNavItem(
              index: 2,
              unselectedIcon: Icons.chair_alt_outlined,
              selectedIcon: Icons.chair_alt_rounded,
              label: 'Cabins',
              isSelected: currentIndex == 2,
              selectedColor: selectedColor,
              unselectedColor: unselectedColor,
            ),
            _buildNavItem(
              index: 3,
              unselectedIcon: Icons.person_outline_rounded,
              selectedIcon: Icons.person_rounded,
              label: 'More',
              isSelected: currentIndex == 3,
              selectedColor: selectedColor,
              unselectedColor: unselectedColor,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required int index,
    required IconData unselectedIcon,
    required IconData selectedIcon,
    required String label,
    required bool isSelected,
    required Color selectedColor,
    required Color unselectedColor,
  }) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _onTap(index),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isSelected ? selectedIcon : unselectedIcon,
                color: isSelected ? selectedColor : unselectedColor,
                size: 22,
              ),
              const SizedBox(height: 3),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? selectedColor : unselectedColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
