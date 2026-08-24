import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../app/theme/theme_provider.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';

/// Hub screen for Administrators and Staff members.
class AdminOverviewStub extends ConsumerWidget {
  const AdminOverviewStub({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currentThemeMode = ref.watch(themeModeProvider);
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Admin & Staff Hub',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        actions: [
          IconButton(
            tooltip: 'Toggle Theme',
            icon: Icon(
              currentThemeMode == ThemeMode.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
              color: isDark
                  ? AppColors.darkAccentTeal
                  : AppColors.lightAccentSky,
            ),
            onPressed: () {
              ref.read(themeModeProvider.notifier).toggleTheme();
            },
          ),
          IconButton(
            tooltip: 'Logout',
            icon: const Icon(Icons.logout_rounded),
            onPressed: () async {
              await ref.read(authNotifierProvider.notifier).logout();
              if (context.mounted) {
                context.go(AppRoutes.login);
              }
            },
          ),
          const SizedBox(width: AppDimensions.space8),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: AppDimensions.screenPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Admin Profile Card
              AppCard(
                hasGlow: true,
                padding: const EdgeInsets.all(20.0),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: AppColors.roleAdmin.withValues(alpha: 0.2),
                      child: const Icon(
                        Icons.admin_panel_settings_rounded,
                        color: AppColors.roleAdmin,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: AppDimensions.space16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'Staff Member',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Role: ${user?.role.displayName ?? "Administrator"}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: AppColors.roleAdmin,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: AppDimensions.space24),

              // Overview Section Title
              Text(
                'Management Consoles',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppDimensions.space12),

              // Action grid for admin
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12.0,
                crossAxisSpacing: 12.0,
                childAspectRatio: 1.15,
                children: [
                  _AdminCard(
                    title: 'Desk Check-In',
                    subtitle: 'Scan Student Passes',
                    icon: Icons.qr_code_scanner_rounded,
                    iconColor: AppColors.roleAdmin,
                    onTap: () => context.push(AppRoutes.cabins),
                  ),
                  _AdminCard(
                    title: 'Cabin Bookings',
                    subtitle: 'Real-time Occupancy',
                    icon: Icons.chair_alt_rounded,
                    iconColor: AppColors.roleStudent,
                    onTap: () => context.push(AppRoutes.cabins),
                  ),
                  _AdminCard(
                    title: 'Course Batches',
                    subtitle: 'Enrollment & Rosters',
                    icon: Icons.school_rounded,
                    iconColor: AppColors.roleFaculty,
                    onTap: () => context.push(AppRoutes.courses),
                  ),
                  _AdminCard(
                    title: 'Broadcasts',
                    subtitle: 'Push Notifications',
                    icon: Icons.campaign_rounded,
                    iconColor: AppColors.darkAccentTeal,
                    onTap: () => context.push(AppRoutes.notifications),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AdminCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;

  const _AdminCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.iconColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8.0),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.15),
              borderRadius: AppDimensions.borderRadiusSm,
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark
                      ? AppColors.darkTextTertiary
                      : AppColors.lightTextTertiary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
