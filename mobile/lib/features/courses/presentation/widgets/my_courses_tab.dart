import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../dashboard/domain/student_dashboard_entity.dart';
import '../../../dashboard/presentation/controllers/student_dashboard_controller.dart';
import '../../../payments/domain/billing_entity.dart';
import '../../../payments/presentation/widgets/due_payment_bottom_sheet.dart';
import '../controllers/courses_controller.dart';
import 'course_detail_sheet.dart';

/// Tab displaying the student's active course enrollments with batch schedule,
/// fee status, roll number, and quick access to study resources.
class MyCoursesTab extends ConsumerWidget {
  final VoidCallback onExploreTap;

  const MyCoursesTab({
    super.key,
    required this.onExploreTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accentColor =
        isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;

    final dashboardAsync = ref.watch(studentDashboardControllerProvider);
    final allCourses =
        ref.watch(coursesControllerProvider).filteredCourses;

    return dashboardAsync.when(
      loading: () => const Center(
        child: CircularProgressIndicator(),
      ),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded,
                  color: AppColors.error, size: 40),
              const SizedBox(height: 12),
              Text(
                'Failed to load active enrollments',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                err.toString(),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref
                    .read(studentDashboardControllerProvider.notifier)
                    .loadDashboard(forceRefresh: true),
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
      data: (summary) {
        final enrollments = summary.enrollments
            .where((e) => e.status.toLowerCase() == 'active')
            .toList();

        if (enrollments.isEmpty) {
          return Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      color: accentColor.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.school_outlined,
                      size: 38,
                      color: accentColor,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    'No Active Enrollments',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You are not currently enrolled in any coaching batch. Explore our programs and start preparing today!',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: onExploreTap,
                    icon: const Icon(Icons.search_rounded, size: 18),
                    label: const Text('Explore Programs'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: accentColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => ref
              .read(studentDashboardControllerProvider.notifier)
              .loadDashboard(forceRefresh: true),
          color: accentColor,
          child: ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: enrollments.length,
            separatorBuilder: (_, __) => const SizedBox(height: 14),
            itemBuilder: (context, index) {
              final enrollment = enrollments[index];
              return _EnrolledCourseCard(
                enrollment: enrollment,
                allCourses: allCourses,
              );
            },
          ),
        );
      },
    );
  }
}

class _EnrolledCourseCard extends StatelessWidget {
  final EnrollmentEntity enrollment;
  final List<dynamic> allCourses;

  const _EnrolledCourseCard({
    required this.enrollment,
    required this.allCourses,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accentColor =
        isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;

    final totalFee = enrollment.totalFee ?? 0;
    final paidAmount = enrollment.paidAmount ?? 0;
    final balance = (totalFee - paidAmount) > 0 ? (totalFee - paidAmount) : 0;
    final isFullyPaid = balance == 0;

    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header: Department Tag & Status Chip
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: accentColor.withValues(alpha: 0.12),
                  borderRadius: AppDimensions.borderRadiusSm,
                ),
                child: Text(
                  enrollment.departmentName.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: accentColor,
                  ),
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.successBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.check_circle_rounded,
                        size: 11, color: AppColors.success),
                    SizedBox(width: 4),
                    Text(
                      'ACTIVE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // 2. Course Name
          Text(
            enrollment.courseName,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w800,
              fontSize: 17,
            ),
          ),

          const SizedBox(height: 4),

          // 3. Roll Number & Enrollment Date Meta
          Row(
            children: [
              if (enrollment.rollNumber != null &&
                  enrollment.rollNumber!.isNotEmpty) ...[
                Text(
                  'Roll No: ${enrollment.rollNumber}',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '•',
                  style: TextStyle(
                    color: isDark
                        ? AppColors.darkTextTertiary
                        : AppColors.lightTextTertiary,
                  ),
                ),
                const SizedBox(width: 8),
              ],
              if (enrollment.enrolledAt != null)
                Text(
                  'Enrolled: ${Formatters.formatShortDate(enrollment.enrolledAt)}',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark
                        ? AppColors.darkTextTertiary
                        : AppColors.lightTextTertiary,
                  ),
                ),
            ],
          ),

          const SizedBox(height: 14),

          // 4. Batch & Schedule Container
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.darkSurfaceElevated
                  : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    Icons.access_time_filled_rounded,
                    size: 20,
                    color: accentColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        enrollment.batchName ?? 'Classroom Batch',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        enrollment.batchTiming ?? 'Daily Scheduled Lectures',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // 5. Fee Payment Status
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: isFullyPaid
                  ? AppColors.successBg
                  : AppColors.warningBg,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: isFullyPaid
                    ? AppColors.success.withValues(alpha: 0.3)
                    : AppColors.warning.withValues(alpha: 0.3),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(
                      isFullyPaid
                          ? Icons.check_circle_outline
                          : Icons.hourglass_top_rounded,
                      size: 16,
                      color: isFullyPaid
                          ? AppColors.success
                          : AppColors.warning,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isFullyPaid
                          ? 'Fee Paid in Full (${Formatters.formatPaiseToRupees(paidAmount)})'
                          : 'Balance Due: ${Formatters.formatPaiseToRupees(balance)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isFullyPaid
                            ? AppColors.success
                            : AppColors.warning,
                      ),
                    ),
                  ],
                ),
                if (!isFullyPaid)
                  ElevatedButton(
                    onPressed: () {
                      final due = PendingDueEntity(
                        id: enrollment.id,
                        type: 'enrollment',
                        itemId: enrollment.courseId,
                        itemName: enrollment.courseName,
                        departmentName: enrollment.departmentName,
                        totalAmount: totalFee.toDouble(),
                        paidAmount: paidAmount.toDouble(),
                        balance: balance.toDouble(),
                        status: 'due',
                      );
                      DuePaymentBottomSheet.show(context, due);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.error,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      minimumSize: const Size(0, 28),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Text(
                      'Pay Now',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 14),
          const Divider(height: 1, thickness: 0.8),
          const SizedBox(height: 10),

          // 6. Quick Action Links
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              TextButton.icon(
                onPressed: () => context.push(AppRoutes.studyMaterials),
                icon: Icon(Icons.menu_book_rounded,
                    size: 16, color: accentColor),
                label: Text(
                  'Study Materials',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: accentColor,
                  ),
                ),
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: const Size(0, 32),
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  // Find matching course entity to open details sheet
                  try {
                    final matchedCourse = allCourses.firstWhere(
                      (c) => c.id == enrollment.courseId,
                    );
                    CourseDetailSheet.show(context, matchedCourse);
                  } catch (_) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                            'Active enrollment for ${enrollment.courseName}'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  }
                },
                icon: Icon(
                  Icons.info_outline_rounded,
                  size: 16,
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
                label: Text(
                  'Program Info',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
                style: TextButton.styleFrom(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  minimumSize: const Size(0, 32),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
