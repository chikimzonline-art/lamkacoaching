import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/app_colors.dart';
import '../../core/utils/haptic_service.dart';

/// Adaptive 4-destination bottom navigation shell for students.
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
        ? AppColors.darkAccentTeal
        : AppColors.lightAccentSky;

    final unselectedColor = isDark
        ? AppColors.darkTextTertiary
        : AppColors.lightTextTertiary;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          border: Border(
            top: BorderSide(
              color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
              width: 1.0,
            ),
          ),
        ),
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: _onTap,
          backgroundColor: Colors.transparent,
          indicatorColor: selectedColor.withValues(alpha: 0.15),
          elevation: 0,
          height: 65,
          labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
          destinations: [
            NavigationDestination(
              icon: Icon(Icons.home_outlined, color: unselectedColor),
              selectedIcon: Icon(Icons.home_rounded, color: selectedColor),
              label: 'Home',
            ),
            NavigationDestination(
              icon: Icon(Icons.menu_book_outlined, color: unselectedColor),
              selectedIcon: Icon(Icons.menu_book_rounded, color: selectedColor),
              label: 'Courses',
            ),
            NavigationDestination(
              icon: Icon(Icons.chair_alt_outlined, color: unselectedColor),
              selectedIcon: Icon(Icons.chair_alt_rounded, color: selectedColor),
              label: 'Cabins',
            ),
            NavigationDestination(
              icon: Icon(Icons.person_outline_rounded, color: unselectedColor),
              selectedIcon: Icon(Icons.person_rounded, color: selectedColor),
              label: 'More',
            ),
          ],
        ),
      ),
    );
  }
}
