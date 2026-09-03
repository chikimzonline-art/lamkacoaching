import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../app/theme/theme_provider.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_error_view.dart';
import '../../../../core/widgets/app_loading_view.dart';
import '../../../auth/data/auth_repository_impl.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../../auth/presentation/controllers/auth_state.dart';
import '../../../auth/presentation/widgets/biometric_enrollment_sheet.dart';
import '../../../../core/security/local_auth_service.dart';
import '../../domain/student_dashboard_entity.dart';
import '../controllers/student_dashboard_controller.dart';
import '../widgets/digital_id_pass_modal.dart';
import '../controllers/dismissed_notices_provider.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../notifications/presentation/controllers/notifications_controller.dart';
import '../../../notifications/application/notification_service.dart';

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
    final dashboardNotifier = ref.read(studentDashboardControllerProvider.notifier);
    
    final notificationsState = ref.watch(notificationsControllerProvider);
    final unreadCount = notificationsState.valueOrNull?.where((n) => !n.read).length ?? 0;

    // Initialize push notifications on dashboard load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationServiceProvider).init();
    });

    // Prompt user to enable 1-Tap Biometrics after first successful login
    if (authState is Authenticated && authState.justLoggedIn) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        ref.read(authNotifierProvider.notifier).consumeJustLoggedIn();
        final localAuth = ref.read(localAuthServiceProvider);
        final isAvailable = await localAuth.isBiometricsAvailable();
        final authRepo = ref.read(authRepositoryProvider);
        final isEnrolled = await authRepo.isBiometricsEnrolled();

        if (isAvailable && !isEnrolled && context.mounted) {
          await BiometricEnrollmentSheet.show(context);
        }
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: Image.asset(
                'assets/images/logo.png',
                width: 28,
                height: 28,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => Icon(
                  Icons.school,
                  size: 28,
                  color: isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky,
                ),
              ),
            ),
            const SizedBox(width: 10),
            Text(
              'Lamka Coaching',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Toggle Theme',
            icon: Icon(
              currentThemeMode == ThemeMode.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
            ),
            onPressed: () {
              ref.read(themeModeProvider.notifier).toggleTheme();
            },
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                tooltip: 'Notifications',
                icon: Icon(
                  Icons.notifications_outlined,
                  color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                ),
                onPressed: () => context.push(AppRoutes.notifications),
              ),
              if (unreadCount > 0)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 16,
                    height: 16,
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        unreadCount > 9 ? '9+' : unreadCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(right: 16.0, left: 8.0),
            child: PopupMenuButton<String>(
              offset: const Offset(0, 48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onSelected: (value) {
                switch (value) {
                  case 'profile':
                    context.go(AppRoutes.profile);
                    break;
                  case 'settings':
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Settings coming soon!')),
                    );
                    break;
                  case 'logout':
                    ref.read(authNotifierProvider.notifier).logout();
                    break;
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'profile',
                  child: Row(
                    children: [
                      Icon(Icons.person_outline, size: 20),
                      SizedBox(width: 12),
                      Text('View Profile'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'settings',
                  child: Row(
                    children: [
                      Icon(Icons.settings_outlined, size: 20),
                      SizedBox(width: 12),
                      Text('Account Settings'),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  value: 'logout',
                  child: Row(
                    children: [
                      const Icon(Icons.logout, size: 20, color: AppColors.error),
                      const SizedBox(width: 12),
                      Text('Log Out', style: theme.textTheme.bodyMedium?.copyWith(color: AppColors.error)),
                    ],
                  ),
                ),
              ],
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    child: Text(
                      (user?.name.isNotEmpty ?? false) ? user!.name[0].toUpperCase() : 'S',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Positioned(
                    bottom: -2,
                    right: -2,
                    child: Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: const Color(0xFF4edea3),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? AppColors.darkBackground : AppColors.lightBackground,
                          width: 2,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
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
            color: isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.fromLTRB(AppDimensions.space16, AppDimensions.space16, AppDimensions.space16, AppDimensions.space32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Hero Section
                  _buildGreetingSection(context, user, summary),
                  const SizedBox(height: AppDimensions.space24),

                  // 2. Digital ID Pass
                  _buildDigitalIdShortcut(context, user, summary),
                  const SizedBox(height: AppDimensions.space24),

                  // 3. Active Study Desk Widget
                  _buildActiveDeskWidget(context, summary),
                  const SizedBox(height: AppDimensions.space24),

                  // 4. Today's Schedule Timeline
                  _buildScheduleSection(context, summary),
                  const SizedBox(height: AppDimensions.space24),

                  // 5. Quick Hub Grid
                  _buildQuickAccessGrid(context),
                  const SizedBox(height: AppDimensions.space24),

                  // 6. Institute Bulletins
                  _buildNoticesSection(context, ref, summary),
                  const SizedBox(height: AppDimensions.space24),

                  // 7. Motivational Quote
                  _buildMotivationalQuote(context, summary),
                  const SizedBox(height: 64),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildGreetingSection(BuildContext context, dynamic user, StudentDashboardSummary summary) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final primaryEnrollment = summary.enrollments.isNotEmpty ? summary.enrollments.first : null;
    final subtitle = primaryEnrollment != null
        ? '${primaryEnrollment.courseName} • ${primaryEnrollment.batchName ?? "Active"}'
        : 'Welcome to your learning dashboard';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Good Morning, ${user?.name ?? "Student"} 👋',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.bold,
            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildDigitalIdShortcut(BuildContext context, dynamic user, StudentDashboardSummary summary) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return GestureDetector(
      onTap: () {
        if (user != null) {
          DigitalIdPassModal.show(
            context,
            user: user,
            enrollments: summary.enrollments,
          );
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.roleStudent.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
              color: AppColors.roleStudent.withValues(alpha: 0.3),
              blurRadius: 12,
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          children: [
            const Positioned(
              top: -20,
              right: -10,
              child: Opacity(
                opacity: 0.1,
                child: Icon(
                  Icons.qr_code_scanner,
                  size: 140,
                  color: AppColors.roleStudent,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.qr_code, color: AppColors.roleStudent),
                      const SizedBox(width: 8),
                      Text(
                        'Digital Student Pass',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: AppColors.roleStudent,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'LC-2026-8891 • Verified Student',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'TAP TO PRESENT',
                    style: theme.textTheme.labelSmall?.copyWith(
                      letterSpacing: 1.2,
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveDeskWidget(BuildContext context, StudentDashboardSummary summary) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final desk = summary.activeBooking;

    final accentColor = isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;

    void navigateToMyCabins() {
      context.go('${AppRoutes.cabins}?tab=my-cabins');
    }

    if (desk == null) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'My Active Desk',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppDimensions.space12),
          InkWell(
            onTap: () => context.go(AppRoutes.cabins),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(AppDimensions.space20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark 
                    ? [const Color(0xFF1A1A1A), const Color(0xFF242424)]
                    : [const Color(0xFFF0F0F0), const Color(0xFFFAFAFA)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                ),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary).withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.desk,
                      color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: AppDimensions.space16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'No Active Booking',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Book a quiet study space now.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: AppDimensions.space12),
                  ElevatedButton(
                    onPressed: () => context.go(AppRoutes.cabins),
                    style: ElevatedButton.styleFrom(
                      minimumSize: Size.zero,
                      backgroundColor: isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky,
                      foregroundColor: AppColors.lightBackground,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                    child: const Text('Book'),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.desk, color: AppColors.roleStudent, size: 24),
            const SizedBox(width: 8),
            Text(
              'My Active Desk',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            const Spacer(),
            InkWell(
              onTap: navigateToMyCabins,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'My Desks',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: accentColor,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: accentColor,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppDimensions.space12),
        InkWell(
          onTap: navigateToMyCabins,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
              boxShadow: [
                BoxShadow(
                  color: AppColors.roleStudent.withValues(alpha: 0.15),
                  blurRadius: 20,
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Stack(
              children: [
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 60,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.roleStudent.withValues(alpha: 0.1),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Wrap(
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Text(
                                  'Active Study Cabin #${desk.cabinNum}',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF4edea3).withValues(alpha: 0.2),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Text(
                                    'RESERVED',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF4edea3),
                                      letterSpacing: 1.1,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.location_on, size: 16, color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                                const SizedBox(width: 4),
                                Text(
                                  'Floor ${desk.floor} • Quiet Study Wing',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.schedule, size: 16, color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary),
                                const SizedBox(width: 4),
                                Text(
                                  desk.formattedType,
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.roleStudent.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.roleStudent.withValues(alpha: 0.3)),
                        ),
                        child: const Icon(Icons.meeting_room, color: AppColors.roleStudent),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildScheduleSection(BuildContext context, StudentDashboardSummary summary) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accentColor = isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;

    void navigateToSchedule() {
      context.push(AppRoutes.scheduleAttendance);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.calendar_today, color: Color(0xFF4edea3), size: 24),
            const SizedBox(width: 8),
            Text(
              "Today's Schedule",
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            const Spacer(),
            InkWell(
              onTap: navigateToSchedule,
              borderRadius: BorderRadius.circular(8),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Full Schedule',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: accentColor,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(
                      Icons.chevron_right_rounded,
                      size: 16,
                      color: accentColor,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppDimensions.space12),

        InkWell(
          onTap: navigateToSchedule,
          borderRadius: BorderRadius.circular(16),
          child: Container(
            decoration: BoxDecoration(
              color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
            ),
            padding: const EdgeInsets.all(16),
            child: summary.todaySchedule.isEmpty
                ? Row(
                    children: [
                      Icon(
                        Icons.event_available_rounded,
                        color: accentColor,
                        size: 24,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'No live class batches scheduled today. Tap to view your enrolled courses.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                          ),
                        ),
                      ),
                      Icon(
                        Icons.chevron_right_rounded,
                        size: 18,
                        color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                      ),
                    ],
                  )
                : Column(
                    children: summary.todaySchedule.asMap().entries.map((entry) {
                      final index = entry.key;
                      final item = entry.value;
                      final isLast = index == summary.todaySchedule.length - 1;
                      return _TimelineItem(item: item, isLast: isLast);
                    }).toList(),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickAccessGrid(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16.0,
      crossAxisSpacing: 16.0,
      childAspectRatio: 1.1,
      children: [
        _QuickActionTile(
          title: 'Study Cabins',
          icon: Icons.meeting_room,
          iconColor: AppColors.roleStudent,
          onTap: () => context.push(AppRoutes.cabins),
        ),
        _QuickActionTile(
          title: 'Course Catalog',
          icon: Icons.menu_book,
          iconColor: const Color(0xFFffb95f), // Tertiary
          onTap: () => context.push(AppRoutes.courses),
        ),
        _QuickActionTile(
          title: 'Fee & Payments',
          icon: Icons.payments,
          iconColor: const Color(0xFF4edea3), // Secondary
          onTap: () => context.push(AppRoutes.paymentHistory),
        ),
        _QuickActionTile(
          title: 'Mock Tests',
          icon: Icons.quiz,
          iconColor: const Color(0xFFa855f7), // Purple
          onTap: () {},
        ),
      ],
    );
  }

  Widget _buildNoticesSection(
      BuildContext context, WidgetRef ref, StudentDashboardSummary summary) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final dismissedIds = ref.watch(dismissedNoticesProvider);
    final activeNotices = summary.notices.where((n) => !dismissedIds.contains(n.id)).toList();

    Widget content;

    if (activeNotices.isEmpty) {
      content = AppCard(
        onTap: () => context.push(AppRoutes.notices),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.check_circle_outline,
                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary, size: 20),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'No new announcements',
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tap to view all past institute bulletins',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ],
        ),
      );
    } else {
      final notice = activeNotices.first;
      content = Dismissible(
        key: ValueKey(notice.id),
        direction: DismissDirection.horizontal,
        onDismissed: (_) {
          ref.read(dismissedNoticesProvider.notifier).update((state) => {...state, notice.id});
        },
        child: AppCard(
          onTap: () => context.push(AppRoutes.notices),
          borderColor: AppColors.error.withValues(alpha: 0.3),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.campaign, color: AppColors.error, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            notice.category?.toUpperCase() ?? 'NEW ALERT',
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: AppColors.error,
                              letterSpacing: 1.1,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          Formatters.formatShortDate(notice.createdAt),
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      notice.title,
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      notice.content,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Recent Announcements',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
              ),
            ),
            TextButton(
              onPressed: () => context.push(AppRoutes.notices),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'View All',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        content,
      ],
    );
  }

  Widget _buildMotivationalQuote(BuildContext context, StudentDashboardSummary summary) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    final quoteText = summary.dailyQuote ?? '"Consistency is the DNA of mastery. Dedicate 2 focused hours today."';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
          ),
        ),
      ),
      child: Column(
        children: [
          Icon(
            Icons.format_quote,
            size: 32,
            color: (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary).withValues(alpha: 0.5),
          ),
          const SizedBox(height: 8),
          Text(
            quoteText,
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontStyle: FontStyle.italic,
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelineItem extends StatelessWidget {
  final StudentScheduleItem item;
  final bool isLast;

  const _TimelineItem({required this.item, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final isSession = item.isInSession;
    final isCompleted = item.isCompleted;
    final dotColor = isSession 
        ? const Color(0xFF4edea3) 
        : (isCompleted ? (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary) : (isDark ? AppColors.darkBorder : AppColors.lightBorder));

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 24,
            child: Column(
              children: [
                Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                    border: !isSession && !isCompleted ? Border.all(color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary) : null,
                    boxShadow: isSession
                        ? [
                            BoxShadow(
                              color: const Color(0xFF4edea3).withValues(alpha: 0.8),
                              blurRadius: 8,
                            )
                          ]
                        : null,
                  ),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1,
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        item.timing,
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: isSession ? const Color(0xFF4edea3) : (isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary),
                        ),
                      ),
                      if (isSession)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4edea3).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF4edea3),
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Text(
                                'IN SESSION',
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF4edea3),
                                ),
                              ),
                            ],
                          ),
                        )
                      else if (isCompleted)
                        Text(
                          'Completed',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                          ),
                        )
                      else
                        Text(
                          'Upcoming',
                          style: theme.textTheme.labelSmall?.copyWith(
                            color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.subject,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    item.instructor ?? item.roomOrCabin ?? 'Instructor',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _QuickActionTile extends StatefulWidget {
  final String title;
  final IconData icon;
  final Color iconColor;
  final VoidCallback onTap;

  const _QuickActionTile({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.onTap,
  });

  @override
  State<_QuickActionTile> createState() => _QuickActionTileState();
}

class _QuickActionTileState extends State<_QuickActionTile> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedScale(
                scale: _isHovered ? 1.1 : 1.0,
                duration: const Duration(milliseconds: 200),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: widget.iconColor.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(widget.icon, color: widget.iconColor),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                widget.title,
                style: theme.textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: isDark ? AppColors.darkTextPrimary : AppColors.lightTextPrimary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
