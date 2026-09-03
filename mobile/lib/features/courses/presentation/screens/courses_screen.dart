import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_error_view.dart';
import '../../../../core/widgets/app_loading_view.dart';
import '../../domain/course_entity.dart';
import '../controllers/courses_controller.dart';
import '../widgets/course_detail_sheet.dart';

/// Interactive Course Explorer and batch discovery screen.
class CoursesScreen extends ConsumerStatefulWidget {
  const CoursesScreen({super.key});

  @override
  ConsumerState<CoursesScreen> createState() => _CoursesScreenState();
}

class _CoursesScreenState extends ConsumerState<CoursesScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final state = ref.watch(coursesControllerProvider);
    final notifier = ref.read(coursesControllerProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Courses & Batches',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Input Field
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: TextField(
                controller: _searchController,
                onChanged: notifier.searchCourses,
                style: theme.textTheme.bodyMedium,
                decoration: InputDecoration(
                  hintText: 'Search courses, subjects, or faculty...',
                  prefixIcon: const Icon(Icons.search_rounded, size: 20),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            notifier.searchCourses('');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: isDark
                      ? AppColors.darkSurfaceElevated
                      : AppColors.lightSurfaceElevated,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: AppDimensions.borderRadiusMd,
                    borderSide: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: AppDimensions.borderRadiusMd,
                    borderSide: BorderSide(
                      color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    ),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: AppDimensions.borderRadiusMd,
                    borderSide: BorderSide(
                      color: isDark
                          ? AppColors.darkAccentTeal
                          : AppColors.lightAccentSky,
                      width: 1.5,
                    ),
                  ),
                ),
              ),
            ),

            // Department Category Horizontal Filter Chips
            if (state.departments.isNotEmpty)
              Container(
                height: 44,
                margin: const EdgeInsets.only(bottom: 8),
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: state.departments.length + 1,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final isAll = index == 0;
                    final dept = isAll ? null : state.departments[index - 1];
                    final isSelected = isAll
                        ? state.selectedDepartmentId == null
                        : state.selectedDepartmentId == dept?.id;

                    return FilterChip(
                      label: Text(isAll ? 'All Departments' : dept!.name),
                      selected: isSelected,
                      onSelected: (_) {
                        notifier.selectDepartment(isAll ? null : dept!.id);
                      },
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                        color: isSelected
                            ? (isDark
                                ? AppColors.darkBackground
                                : Colors.white)
                            : (isDark
                                ? AppColors.darkTextSecondary
                                : AppColors.lightTextSecondary),
                      ),
                      selectedColor: isDark
                          ? AppColors.darkAccentTeal
                          : AppColors.lightAccentSky,
                      backgroundColor: isDark
                          ? AppColors.darkSurface
                          : AppColors.lightSurface,
                      checkmarkColor: isDark
                          ? AppColors.darkBackground
                          : Colors.white,
                      side: BorderSide(
                        color: isSelected
                            ? Colors.transparent
                            : (isDark
                                ? AppColors.darkBorder
                                : AppColors.lightBorder),
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    );
                  },
                ),
              ),

            // Main Body: Course List with Pull to Refresh
            Expanded(
              child: RefreshIndicator(
                onRefresh: notifier.refresh,
                color: isDark
                    ? AppColors.darkAccentTeal
                    : AppColors.lightAccentSky,
                child: _buildCoursesBody(context, state, notifier),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCoursesBody(
    BuildContext context,
    CoursesState state,
    CoursesNotifier notifier,
  ) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (state.isLoading && state.departments.isEmpty) {
      return const AppLoadingView(message: 'Loading courses catalog...');
    }

    if (state.errorMessage != null && state.departments.isEmpty) {
      return AppErrorView(
        message: state.errorMessage!,
        onRetry: () => notifier.loadCourses(forceRefresh: true),
      );
    }

    final courses = state.filteredCourses;

    if (courses.isEmpty) {
      return Center(
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.search_off_rounded,
                size: 56,
                color: isDark
                    ? AppColors.darkTextTertiary
                    : AppColors.lightTextTertiary,
              ),
              const SizedBox(height: 16),
              Text(
                'No courses found',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Try searching for another keyword or change the department filter.',
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: isDark
                      ? AppColors.darkTextSecondary
                      : AppColors.lightTextSecondary,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
      itemCount: courses.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final course = courses[index];
        return _CourseCard(
          course: course,
          onTap: () => CourseDetailSheet.show(context, course),
        );
      },
    );
  }
}

class _CourseCard extends StatelessWidget {
  final CourseEntity course;
  final VoidCallback onTap;

  const _CourseCard({required this.course, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Department pill & Seat status badge
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: (isDark
                          ? AppColors.darkAccentTeal
                          : AppColors.lightAccentSky)
                      .withValues(alpha: 0.15),
                  borderRadius: AppDimensions.borderRadiusSm,
                ),
                child: Text(
                  course.departmentName.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                    color: isDark
                        ? AppColors.darkAccentTeal
                        : AppColors.lightAccentSky,
                  ),
                ),
              ),
              _buildSeatAvailabilityBadge(context, course),
            ],
          ),

          const SizedBox(height: 10),

          // Course Name
          Text(
            course.name,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),

          const SizedBox(height: 6),

          // Next Batch / Timing preview
          if (course.effectiveNextBatch != null) ...[
            Row(
              children: [
                Icon(
                  Icons.access_time_rounded,
                  size: 14,
                  color: isDark
                      ? AppColors.darkTextTertiary
                      : AppColors.lightTextTertiary,
                ),
                const SizedBox(width: 5),
                Expanded(
                  child: Text(
                    '${course.effectiveNextBatch!.batchName} • ${course.effectiveNextBatch!.timing}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],

          const Divider(height: 16, thickness: 0.8),

          // Bottom Ribbon: Price + Duration + Action
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Text(
                    Formatters.formatPaiseToRupees(course.totalFee),
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: isDark
                          ? AppColors.darkAccentTeal
                          : AppColors.lightAccentSky,
                    ),
                  ),
                  if (course.duration != null) ...[
                    const SizedBox(width: 6),
                    Text(
                      '(${course.duration})',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary,
                      ),
                    ),
                  ],
                ],
              ),
              Row(
                children: [
                  Text(
                    'Details',
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.darkAccentTeal
                          : AppColors.lightAccentSky,
                    ),
                  ),
                  const SizedBox(width: 2),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 16,
                    color: isDark
                        ? AppColors.darkAccentTeal
                        : AppColors.lightAccentSky,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSeatAvailabilityBadge(BuildContext context, CourseEntity course) {
    if (course.batches.isEmpty) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.warningBg,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Text(
          'Upcoming',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppColors.warning,
          ),
        ),
      );
    }

    final next = course.effectiveNextBatch;
    if (next != null && next.seatsAvailable <= 3 && next.seatsAvailable > 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.warningBg,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          '${next.seatsAvailable} seats left',
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppColors.warning,
          ),
        ),
      );
    }

    if (next != null && next.seatsAvailable == 0) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
        decoration: BoxDecoration(
          color: AppColors.errorBg,
          borderRadius: BorderRadius.circular(10),
        ),
        child: const Text(
          'Batch Full',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: AppColors.error,
          ),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        color: AppColors.successBg,
        borderRadius: BorderRadius.circular(10),
      ),
      child: const Text(
        'Enrolling',
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: AppColors.success,
        ),
      ),
    );
  }
}
