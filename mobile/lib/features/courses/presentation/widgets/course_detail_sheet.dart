import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../../auth/presentation/controllers/auth_state.dart';
import '../../../dashboard/presentation/controllers/student_dashboard_controller.dart';
import '../../data/courses_repository_impl.dart';
import '../../domain/course_entity.dart';
import 'course_enrollment_checkout_sheet.dart';

/// Redesigned Course Detail Sheet matching Wireframe 2 with interactive batch selection,
/// program highlights, and a persistent sticky bottom checkout action bar.
class CourseDetailSheet extends ConsumerStatefulWidget {
  final CourseEntity course;

  const CourseDetailSheet({super.key, required this.course});

  /// Helper to display the bottom sheet.
  static Future<void> show(BuildContext context, CourseEntity course) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CourseDetailSheet(course: course),
    );
  }

  @override
  ConsumerState<CourseDetailSheet> createState() => _CourseDetailSheetState();
}

class _CourseDetailSheetState extends ConsumerState<CourseDetailSheet> {
  String? _selectedBatchId;
  bool _isWaitlisted = false;
  bool _isWaitlisting = false;

  @override
  void initState() {
    super.initState();
    // Pre-select the first batch that has seats available
    final openBatches = widget.course.batches.where((b) => b.hasSeats).toList();
    if (openBatches.isNotEmpty) {
      _selectedBatchId = openBatches.first.id;
    } else if (widget.course.batches.isNotEmpty) {
      _selectedBatchId = widget.course.batches.first.id;
    }

    _checkWaitlistStatus();
  }

  Future<void> _checkWaitlistStatus() async {
    try {
      final authState = ref.read(authNotifierProvider);
      if (authState is Authenticated) {
        final waitlisted = await ref
            .read(coursesRepositoryProvider)
            .checkWaitlistStatus(widget.course.id);
        if (mounted) {
          setState(() => _isWaitlisted = waitlisted);
        }
      }
    } catch (_) {}
  }

  Future<void> _handleJoinWaitlist() async {
    final authState = ref.read(authNotifierProvider);
    if (authState is! Authenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please sign in to join the course waitlist'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      await context.push(AppRoutes.login);
      return;
    }

    setState(() => _isWaitlisting = true);
    try {
      await ref
          .read(coursesRepositoryProvider)
          .joinCourseWaitlist(widget.course.id);
      if (mounted) {
        setState(() {
          _isWaitlisted = true;
          _isWaitlisting = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              "You'll receive an instant notification when a batch opens for ${widget.course.name}!",
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isWaitlisting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceAll('Exception: ', '')),
            backgroundColor: AppColors.error,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  Future<void> _handleEnrollAndPay(
      BuildContext context, BatchEntity selectedBatch) async {
    final authState = ref.read(authNotifierProvider);
    if (authState is! Authenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please sign in to enroll in this course'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      await context.push(AppRoutes.login);
      return;
    }

    final navigator = Navigator.of(context);
    final enrolled = await CourseEnrollmentCheckoutSheet.show(
      context,
      course: widget.course,
      batch: selectedBatch,
    );

    if (enrolled == true && mounted) {
      navigator.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final accentColor =
        isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;
    final course = widget.course;

    // Check if the current student is already actively enrolled
    final dashboardState = ref.watch(studentDashboardControllerProvider);
    final isAlreadyEnrolled = dashboardState.value?.enrollments.any(
          (e) => e.courseId == course.id && e.status == 'active',
        ) ??
        false;

    // Check available open batches
    final openBatches = course.batches.where((b) => b.hasSeats).toList();
    final hasAvailableBatch = openBatches.isNotEmpty;

    // Currently selected batch
    BatchEntity? selectedBatch;
    if (course.batches.isNotEmpty) {
      try {
        selectedBatch = course.batches.firstWhere(
          (b) => b.id == _selectedBatchId,
          orElse: () => course.batches.first,
        );
      } catch (_) {
        selectedBatch = course.batches.first;
      }
    }

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.90,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppDimensions.radiusLg),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            // 1. Drag Handle
            Padding(
              padding: const EdgeInsets.only(top: 12, bottom: 8),
              child: Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),

            // 2. Scrollable Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header: Department Pill & Live Seat Tag
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: accentColor.withValues(alpha: 0.12),
                            borderRadius: AppDimensions.borderRadiusSm,
                          ),
                          child: Text(
                            course.departmentName.toUpperCase(),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: accentColor,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        _buildStatusBadge(context, course),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Course Name
                    Text(
                      course.name,
                      style: theme.textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),

                    const SizedBox(height: 6),

                    // Quick Meta (Rating, Duration)
                    Row(
                      children: [
                        const Icon(
                          Icons.star_rounded,
                          size: 17,
                          color: Color(0xFFF59E0B),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '4.9',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : Colors.black87,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(120+ students enrolled)',
                          style: TextStyle(
                            fontSize: 12,
                            color: isDark
                                ? AppColors.darkTextTertiary
                                : AppColors.lightTextTertiary,
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
                        Text(
                          course.duration ?? '12 Months',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Course Overview Box
                    Text(
                      'Course Overview',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      course.description ??
                          'In-depth classroom sessions covering theoretical fundamentals, intensive problem-solving drills, full-length test series, and dedicated mentor support.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                        height: 1.45,
                      ),
                    ),

                    const SizedBox(height: 22),

                    // Select Your Batch Schedule Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Select Your Batch Schedule',
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (course.batches.length > 1 && hasAvailableBatch)
                          Text(
                            'Choose one',
                            style: TextStyle(
                              fontSize: 11,
                              color: isDark
                                  ? AppColors.darkTextTertiary
                                  : AppColors.lightTextTertiary,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Batches List
                    if (course.batches.isEmpty)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: isDark
                              ? AppColors.darkSurfaceElevated
                              : const Color(0xFFF8FAFC),
                          borderRadius: AppDimensions.borderRadiusMd,
                          border: Border.all(
                            color: isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.notifications_active_outlined,
                              color: accentColor,
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'No active batches right now. Tap "Notify Me When Open" below to join the waitlist.',
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
                        itemCount: course.batches.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final batch = course.batches[index];
                          final isSelected = _selectedBatchId == batch.id;
                          final isFull = batch.isFull || batch.seatsAvailable <= 0;

                          return Opacity(
                            opacity: isFull ? 0.55 : 1.0,
                            child: InkWell(
                              onTap: isFull
                                  ? null
                                  : () {
                                      setState(() => _selectedBatchId = batch.id);
                                    },
                              borderRadius:
                                  BorderRadius.circular(AppDimensions.radiusMd),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: isSelected
                                      ? accentColor.withValues(alpha: 0.09)
                                      : (isDark
                                          ? AppColors.darkSurfaceElevated
                                          : AppColors.lightSurface),
                                  borderRadius: BorderRadius.circular(
                                      AppDimensions.radiusMd),
                                  border: Border.all(
                                    color: isSelected
                                        ? accentColor
                                        : (isDark
                                            ? AppColors.darkBorder
                                            : AppColors.lightBorder),
                                    width: isSelected ? 2 : 1,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    // Custom Radio Circle
                                    Container(
                                      width: 20,
                                      height: 20,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected
                                              ? accentColor
                                              : (isDark
                                                  ? AppColors.darkTextTertiary
                                                  : AppColors.lightTextTertiary),
                                          width: isSelected ? 6 : 2,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            batch.batchName,
                                            style: theme.textTheme.titleSmall
                                                ?.copyWith(
                                              fontWeight: isSelected
                                                  ? FontWeight.w800
                                                  : FontWeight.w600,
                                            ),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${batch.timing}  •  Starts ${Formatters.formatShortDate(batch.startDate)}',
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              fontSize: 11,
                                              color: isDark
                                                  ? AppColors.darkTextSecondary
                                                  : AppColors.lightTextSecondary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    _buildBatchSeatChip(context, batch),
                                  ],
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                    const SizedBox(height: 24),

                    // Program Highlights Checklist
                    Text(
                      'Program Highlights & Facilities',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const _HighlightItem(
                      text: 'Complete updated syllabus coverage with 150+ mock tests',
                    ),
                    const _HighlightItem(
                      text: 'Dedicated study cabin desk reservation with high-speed WiFi',
                    ),
                    const _HighlightItem(
                      text: 'Daily 1-on-1 mentor doubt clearance sessions',
                    ),
                    const _HighlightItem(
                      text: 'Complete printed study kits and personalized analytics',
                    ),

                    const SizedBox(height: 24),

                    // Faculty & Mentorship Note
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkSurfaceElevated
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.verified_user_outlined,
                            size: 20,
                            color: accentColor,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Expert Faculty & Mentors',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: isDark ? Colors.white : Colors.black87,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Taught by certified educators with proven competitive exam results.',
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

                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),

            // 3. Persistent Sticky Bottom Checkout Bar (Wireframe 2)
            Container(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 14),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.darkSurfaceElevated
                    : AppColors.lightSurface,
                border: Border(
                  top: BorderSide(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    width: 1,
                  ),
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  // Fee Summary
                  Expanded(
                    flex: 4,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Total Fee',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? AppColors.darkTextTertiary
                                : AppColors.lightTextTertiary,
                            letterSpacing: 0.5,
                          ),
                        ),
                        Text(
                          Formatters.formatPaiseToRupees(course.totalFee),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          'or from ₹500/mo',
                          style: TextStyle(
                            fontSize: 10,
                            color: isDark
                                ? AppColors.darkTextTertiary
                                : AppColors.lightTextTertiary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(width: 12),

                  // Action CTA Button
                  Expanded(
                    flex: 6,
                    child: isAlreadyEnrolled
                        ? const AppButton(
                            text: 'Already Enrolled',
                            icon: Icon(Icons.check_circle_rounded, size: 18),
                            onPressed: null,
                          )
                        : (hasAvailableBatch && selectedBatch != null)
                            ? AppButton(
                                text: 'Enroll & Pay Now',
                                icon: const Icon(Icons.lock_outline, size: 17),
                                onPressed: () =>
                                    _handleEnrollAndPay(context, selectedBatch!),
                              )
                            : AppButton(
                                text: _isWaitlisted
                                    ? 'On Waitlist'
                                    : 'Notify Me When Open',
                                icon: Icon(
                                  _isWaitlisted
                                      ? Icons.check_circle_outline
                                      : Icons.notifications_active_outlined,
                                  size: 17,
                                ),
                                isLoading: _isWaitlisting,
                                onPressed: _isWaitlisted || _isWaitlisting
                                    ? null
                                    : _handleJoinWaitlist,
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

  Widget _buildStatusBadge(BuildContext context, CourseEntity course) {
    Color bg;
    Color fg;
    String label;

    if (course.hasOpenBatches) {
      bg = AppColors.successBg;
      fg = AppColors.success;
      label = '🟢 Enrolling';
    } else if (course.isOngoing) {
      bg = AppColors.infoBg;
      fg = AppColors.info;
      label = '🔵 In Progress';
    } else {
      bg = AppColors.warningBg;
      fg = AppColors.warning;
      label = '⏳ Upcoming';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: fg.withValues(alpha: 0.3)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildBatchSeatChip(BuildContext context, BatchEntity batch) {
    Color bg;
    Color fg;
    String text;

    if (batch.isFull || batch.seatsAvailable <= 0) {
      bg = AppColors.errorBg;
      fg = AppColors.error;
      text = 'Full';
    } else if (batch.isAlmostFull || batch.seatsAvailable <= 3) {
      bg = AppColors.warningBg;
      fg = AppColors.warning;
      text = '${batch.seatsAvailable} left';
    } else {
      bg = AppColors.successBg;
      fg = AppColors.success;
      text = '${batch.seatsAvailable} seats';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _HighlightItem extends StatelessWidget {
  final String text;

  const _HighlightItem({required this.text});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle_rounded,
            size: 16,
            color: AppColors.success,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: theme.textTheme.bodySmall?.copyWith(
                fontSize: 12,
                color: isDark
                    ? AppColors.darkTextSecondary
                    : AppColors.lightTextSecondary,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
