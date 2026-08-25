import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../domain/course_entity.dart';

/// Modal bottom sheet displaying complete course details, syllabus, and batch timings.
class CourseDetailSheet extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppDimensions.radiusLg),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      child: SafeArea(
        top: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle Bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Department & Status Tag
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: (isDark
                                    ? AppColors.darkAccentTeal
                                    : AppColors.lightAccentSky)
                                .withValues(alpha: 0.15),
                            borderRadius: AppDimensions.borderRadiusSm,
                          ),
                          child: Text(
                            course.departmentName.toUpperCase(),
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: isDark
                                  ? AppColors.darkAccentTeal
                                  : AppColors.lightAccentSky,
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
                        fontWeight: FontWeight.w700,
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Price & Duration Banner
                    Row(
                      children: [
                        Text(
                          Formatters.formatCurrency(course.totalFee),
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: isDark
                                ? AppColors.darkAccentTeal
                                : AppColors.lightAccentSky,
                          ),
                        ),
                        if (course.duration != null) ...[
                          const SizedBox(width: 8),
                          Text(
                            '•  ${course.duration}',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ],
                    ),

                    const Divider(height: 28, thickness: 1),

                    // Course Overview Section
                    Text(
                      'Overview',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      course.description ??
                          'Comprehensive competitive exam preparation covering theory, rigorous test series, daily doubt resolution, and study material by expert faculty.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        height: 1.45,
                        color: isDark
                            ? AppColors.darkTextSecondary
                            : AppColors.lightTextSecondary,
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Batches Timetable Section
                    Text(
                      'Upcoming & Active Batches',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),

                    if (course.batches.isEmpty)
                      AppCard(
                        padding: const EdgeInsets.all(14),
                        child: Text(
                          'New batches will be announced soon. You can place an early inquiry below.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary,
                          ),
                        ),
                      )
                    else
                      ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: course.batches.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 8),
                        itemBuilder: (context, index) {
                          final batch = course.batches[index];
                          return AppCard(
                            padding: const EdgeInsets.all(14),
                            child: Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: (isDark
                                            ? AppColors.darkAccentTeal
                                            : AppColors.lightAccentSky)
                                        .withValues(alpha: 0.12),
                                    borderRadius: AppDimensions.borderRadiusSm,
                                  ),
                                  child: Icon(
                                    Icons.access_time_rounded,
                                    size: 20,
                                    color: isDark
                                        ? AppColors.darkAccentTeal
                                        : AppColors.lightAccentSky,
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
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        batch.timing,
                                        style:
                                            theme.textTheme.bodySmall?.copyWith(
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
                          );
                        },
                      ),

                    const SizedBox(height: 20),

                    // Program Highlights
                    Text(
                      'Program Highlights',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const _HighlightItem(text: 'Complete updated syllabus & mock tests'),
                    const _HighlightItem(text: 'Dedicated study cabin & library access'),
                    const _HighlightItem(text: 'Daily doubt clearance sessions with mentors'),
                    const _HighlightItem(text: 'Printed study kits & performance analysis'),

                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 12),

            // Admission Inquiry CTA
            AppButton(
              text: 'Inquire for Admission',
              icon: const Icon(Icons.school_rounded, size: 18),
              onPressed: () {
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Admission desk for "${course.name}" notified! Visit center office for registration.',
                    ),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
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
      label = 'Enrolling';
    } else if (course.isOngoing) {
      bg = AppColors.infoBg;
      fg = AppColors.info;
      label = 'In Progress';
    } else {
      bg = AppColors.warningBg;
      fg = AppColors.warning;
      label = 'Upcoming';
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
          fontWeight: FontWeight.w600,
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
          fontSize: 11,
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
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
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
                color: isDark
                    ? AppColors.darkTextSecondary
                    : AppColors.lightTextSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
