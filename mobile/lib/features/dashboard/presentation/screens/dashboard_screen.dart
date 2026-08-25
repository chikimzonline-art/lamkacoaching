import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../app/theme/theme_provider.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_error_view.dart';
import '../../../../core/widgets/app_loading_view.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../domain/student_dashboard_entity.dart';
import '../controllers/student_dashboard_controller.dart';
import '../widgets/digital_id_pass_modal.dart';

/// Main student experience hub with live timelines, desk widgets, and announcements.
class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currentThemeMode = ref.watch(themeModeProvider);
    final authState = ref.watch(authNotifierProvider);
    final user = authState.user;

    final dashboardAsync = ref.watch(studentDashboardControllerProvider);
    final dashboardNotifier =
        ref.read(studentDashboardControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: (isDark
                        ? AppColors.darkAccentTeal
                        : AppColors.lightAccentSky)
                    .withValues(alpha: 0.15),
                borderRadius: AppDimensions.borderRadiusSm,
              ),
              child: Icon(
                Icons.school_rounded,
                size: 20,
                color: isDark
                    ? AppColors.darkAccentTeal
                    : AppColors.lightAccentSky,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Lamka Coaching',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
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
            tooltip: 'Notifications',
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => context.push(AppRoutes.notifications),
          ),
          const SizedBox(width: AppDimensions.space8),
        ],
      ),
      body: SafeArea(
        child: dashboardAsync.when(
          loading: () => const AppLoadingView(message: 'Loading your student hub...'),
          error: (error, _) => AppErrorView(
            message: error.toString(),
            onRetry: () => dashboardNotifier.loadDashboard(forceRefresh: true),
          ),
          data: (summary) => RefreshIndicator(
            onRefresh: dashboardNotifier.refresh,
            color: isDark
                ? AppColors.darkAccentTeal
                : AppColors.lightAccentSky,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: AppDimensions.screenPadding,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Welcome Ribbon
                  _buildGreetingRibbon(context, user, summary),

                  const SizedBox(height: AppDimensions.space16),

                  // 2. Digital ID Pass High-Contrast Shortcut Card
                  _buildDigitalIdShortcut(context, user, summary),

                  const SizedBox(height: AppDimensions.space20),

                  // 3. Today's Batch & Class Timeline
                  _buildScheduleSection(context, summary),

                  const SizedBox(height: AppDimensions.space20),

                  // 4. Active Study Desk Widget
                  _buildActiveDeskWidget(context, summary),

                  const SizedBox(height: AppDimensions.space20),

                  // 5. Notices & Announcements Carousel
                  _buildNoticesSection(context, summary),

                  const SizedBox(height: AppDimensions.space20),

                  // 6. Quick Access Navigation Grid
                  _buildQuickAccessGrid(context),

                  const SizedBox(height: AppDimensions.space24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGreetingRibbon(
    BuildContext context,
    dynamic user,
    StudentDashboardSummary summary,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final primaryEnrollment = summary.enrollments.isNotEmpty
        ? summary.enrollments.first
        : null;

    final subtitle = primaryEnrollment != null
        ? '${primaryEnrollment.courseName} • ${primaryEnrollment.batchName ?? "Active"}'
        : 'Welcome to your learning dashboard';

    return AppCard(
      hasGlow: true,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          CircleAvatar(
            radius: 26,
            backgroundColor: isDark
                ? AppColors.darkAccentTeal.withValues(alpha: 0.2)
                : AppColors.lightAccentSky.withValues(alpha: 0.15),
            child: Text(
              (user?.name.isNotEmpty ?? false)
                  ? user.name[0].toUpperCase()
                  : 'S',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: isDark
                    ? AppColors.darkAccentTeal
                    : AppColors.lightAccentSky,
              ),
            ),
          ),
          const SizedBox(width: AppDimensions.space16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hello, ${user?.name ?? "Student"}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark
                        ? AppColors.darkAccentTeal
                        : AppColors.lightAccentSky,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDigitalIdShortcut(
    BuildContext context,
    dynamic user,
    StudentDashboardSummary summary,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AppCard(
      onTap: () {
        if (user != null) {
          DigitalIdPassModal.show(
            context,
            user: user,
            enrollments: summary.enrollments,
          );
        }
      },
      padding: const EdgeInsets.all(16),
      borderColor: (isDark
              ? AppColors.darkAccentTeal
              : AppColors.lightAccentSky)
          .withValues(alpha: 0.35),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (isDark
                      ? AppColors.darkAccentTeal
                      : AppColors.lightAccentSky)
                  .withValues(alpha: 0.15),
              borderRadius: AppDimensions.borderRadiusSm,
            ),
            child: Icon(
              Icons.qr_code_rounded,
              color: isDark
                  ? AppColors.darkAccentTeal
                  : AppColors.lightAccentSky,
              size: 26,
            ),
          ),
          const SizedBox(width: AppDimensions.space16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Digital Student Pass',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  'Tap to present dynamic QR code for entry',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark
                        ? AppColors.darkTextTertiary
                        : AppColors.lightTextTertiary,
                  ),
                ),
              ],
            ),
          ),
          Icon(
            Icons.arrow_forward_ios_rounded,
            size: 14,
            color: isDark
                ? AppColors.darkAccentTeal
                : AppColors.lightAccentSky,
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleSection(
    BuildContext context,
    StudentDashboardSummary summary,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Today's Schedule",
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              Formatters.formatDate(DateTime.now()),
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark
                    ? AppColors.darkTextTertiary
                    : AppColors.lightTextTertiary,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppDimensions.space12),

        if (summary.todaySchedule.isEmpty)
          AppCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(
                  Icons.event_available_rounded,
                  color: isDark
                      ? AppColors.darkAccentTeal
                      : AppColors.lightAccentSky,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No live class batches scheduled today. Perfect time for cabin self-study!',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: summary.todaySchedule.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final item = summary.todaySchedule[index];
              return _ScheduleItemCard(item: item);
            },
          ),
      ],
    );
  }

  Widget _buildActiveDeskWidget(
    BuildContext context,
    StudentDashboardSummary summary,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final desk = summary.activeBooking;

    if (desk == null) {
      return AppCard(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.roleStudent.withValues(alpha: 0.12),
                borderRadius: AppDimensions.borderRadiusSm,
              ),
              child: const Icon(
                Icons.chair_alt_rounded,
                color: AppColors.roleStudent,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Study Space Cabins',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Reserve a quiet personal desk on Floor 3',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? AppColors.darkTextTertiary
                          : AppColors.lightTextTertiary,
                    ),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () => context.push(AppRoutes.cabins),
              child: const Text('View Cabins'),
            ),
          ],
        ),
      );
    }

    return AppCard(
      padding: const EdgeInsets.all(16),
      borderColor: AppColors.roleStudent.withValues(alpha: 0.4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.chair_alt_rounded,
                    color: AppColors.roleStudent,
                    size: 20,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Active Study Cabin #${desk.cabinNum}',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.successBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'Reserved',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: AppColors.success,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            'Floor ${desk.floor} • ${desk.formattedType}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: isDark
                  ? AppColors.darkTextSecondary
                  : AppColors.lightTextSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNoticesSection(
    BuildContext context,
    StudentDashboardSummary summary,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (summary.notices.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Institute Bulletins',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            Text(
              '${summary.notices.length} updates',
              style: theme.textTheme.bodySmall?.copyWith(
                color: isDark
                    ? AppColors.darkTextTertiary
                    : AppColors.lightTextTertiary,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppDimensions.space12),

        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: summary.notices.take(3).length,
          separatorBuilder: (_, __) => const SizedBox(height: 8),
          itemBuilder: (context, index) {
            final notice = summary.notices[index];
            return AppCard(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: (isDark
                                  ? AppColors.darkAccentTeal
                                  : AppColors.lightAccentSky)
                              .withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          notice.category?.toUpperCase() ?? 'NOTICE',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                            color: isDark
                                ? AppColors.darkAccentTeal
                                : AppColors.lightAccentSky,
                          ),
                        ),
                      ),
                      Text(
                        Formatters.formatShortDate(notice.createdAt),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontSize: 11,
                          color: isDark
                              ? AppColors.darkTextTertiary
                              : AppColors.lightTextTertiary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notice.title,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notice.content,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildQuickAccessGrid(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quick Hub Actions',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: AppDimensions.space12),

        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12.0,
          crossAxisSpacing: 12.0,
          childAspectRatio: 1.25,
          children: [
            _QuickActionTile(
              title: 'Study Cabins',
              subtitle: 'Bookings & Slots',
              icon: Icons.chair_alt_rounded,
              iconColor: AppColors.roleStudent,
              onTap: () => context.push(AppRoutes.cabins),
            ),
            _QuickActionTile(
              title: 'Course Catalog',
              subtitle: 'Batches & Fees',
              icon: Icons.menu_book_rounded,
              iconColor: AppColors.roleFaculty,
              onTap: () => context.push(AppRoutes.courses),
            ),
            _QuickActionTile(
              title: 'Notifications',
              subtitle: 'Alerts & Updates',
              icon: Icons.notifications_active_outlined,
              iconColor: AppColors.roleAdmin,
              onTap: () => context.push(AppRoutes.notifications),
            ),
            _QuickActionTile(
              title: 'My Profile',
              subtitle: 'Settings & Security',
              icon: Icons.person_outline_rounded,
              iconColor: AppColors.success,
              onTap: () => context.push(AppRoutes.more),
            ),
          ],
        ),
      ],
    );
  }
}

class _ScheduleItemCard extends StatelessWidget {
  final StudentScheduleItem item;

  const _ScheduleItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    Color statusColor;
    String statusLabel;

    if (item.isInSession) {
      statusColor = isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;
      statusLabel = 'In Session';
    } else if (item.isCompleted) {
      statusColor = isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary;
      statusLabel = 'Completed';
    } else {
      statusColor = AppColors.warning;
      statusLabel = 'Upcoming';
    }

    return AppCard(
      padding: const EdgeInsets.all(14),
      borderColor: item.isInSession
          ? statusColor.withValues(alpha: 0.5)
          : null,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: AppDimensions.borderRadiusSm,
            ),
            child: Icon(Icons.access_time_filled_rounded,
                color: statusColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.subject,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${item.timing} • ${item.roomOrCabin ?? "Hall A"}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              statusLabel,
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;

  const _QuickActionTile({
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
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(7.0),
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.15),
              borderRadius: AppDimensions.borderRadiusSm,
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(
                subtitle,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontSize: 11,
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
