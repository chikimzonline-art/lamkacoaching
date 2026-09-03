import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/haptic_service.dart';
import '../../data/courses_repository_impl.dart';
import '../../domain/course_entity.dart';
import '../../domain/courses_repository.dart';

/// State representation for the Course Explorer.
class CoursesState {
  final List<DepartmentEntity> departments;
  final String? selectedDepartmentId;
  final String searchQuery;
  final bool isLoading;
  final String? errorMessage;

  const CoursesState({
    this.departments = const [],
    this.selectedDepartmentId,
    this.searchQuery = '',
    this.isLoading = false,
    this.errorMessage,
  });

  /// Flattens and filters all courses based on department chip and search query.
  List<CourseEntity> get filteredCourses {
    List<CourseEntity> courses = [];

    if (selectedDepartmentId == null || selectedDepartmentId!.isEmpty) {
      for (final dept in departments) {
        courses.addAll(dept.courses);
      }
    } else {
      final dept = departments.firstWhere(
        (d) => d.id == selectedDepartmentId,
        orElse: () => const DepartmentEntity(id: '', name: ''),
      );
      courses.addAll(dept.courses);
    }

    if (searchQuery.trim().isNotEmpty) {
      final query = searchQuery.trim().toLowerCase();
      courses = courses.where((c) {
        final nameMatches = c.name.toLowerCase().contains(query);
        final deptMatches = c.departmentName.toLowerCase().contains(query);
        final descMatches = c.description?.toLowerCase().contains(query) ?? false;
        return nameMatches || deptMatches || descMatches;
      }).toList();
    }

    // Intelligent multi-tier sorting:
    // Tier 3 (top): Open batches with available seats
    // Tier 2: Upcoming / scheduled batches
    // Tier 1 (bottom): No open batches or all batches full
    courses.sort((a, b) {
      int getAvailabilityScore(CourseEntity c) {
        final hasSeatsAvailable = c.batches.any((batch) => batch.hasSeats);
        if (hasSeatsAvailable) return 3;
        if (c.batches.isNotEmpty) return 2;
        return 1;
      }

      final scoreDiff = getAvailabilityScore(b).compareTo(getAvailabilityScore(a));
      if (scoreDiff != 0) return scoreDiff;

      // Secondary sort: earliest next batch start date
      final aDate = a.effectiveNextBatch?.startDate;
      final bDate = b.effectiveNextBatch?.startDate;
      if (aDate != null && bDate != null) {
        return aDate.compareTo(bDate);
      }
      return a.name.compareTo(b.name);
    });

    return courses;
  }

  /// Courses with high demand, imminent start dates, or fast-filling batches.
  List<CourseEntity> get trendingCourses {
    return filteredCourses.where((c) {
      return c.batches.any((b) => b.hasSeats);
    }).take(5).toList();
  }

  CoursesState copyWith({
    List<DepartmentEntity>? departments,
    String? Function()? selectedDepartmentId,
    String? searchQuery,
    bool? isLoading,
    String? Function()? errorMessage,
  }) {
    return CoursesState(
      departments: departments ?? this.departments,
      selectedDepartmentId: selectedDepartmentId != null
          ? selectedDepartmentId()
          : this.selectedDepartmentId,
      searchQuery: searchQuery ?? this.searchQuery,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage != null ? errorMessage() : this.errorMessage,
    );
  }
}

/// Riverpod provider for the [CoursesNotifier].
final coursesControllerProvider =
    StateNotifierProvider<CoursesNotifier, CoursesState>((ref) {
  final repository = ref.watch(coursesRepositoryProvider);
  return CoursesNotifier(repository);
});

/// Controller managing course search, department filtering, and refresh states.
class CoursesNotifier extends StateNotifier<CoursesState> {
  final CoursesRepository _repository;

  CoursesNotifier(this._repository) : super(const CoursesState(isLoading: true)) {
    loadCourses();
  }

  /// Fetches courses categorized by department from the repository.
  Future<void> loadCourses({bool forceRefresh = false}) async {
    if (!forceRefresh && state.departments.isNotEmpty) return;

    state = state.copyWith(isLoading: true, errorMessage: () => null);

    final result = await _repository.getCoursesCategorized();
    result.fold(
      (failure) {
        state = state.copyWith(
          isLoading: false,
          errorMessage: () => failure.message,
        );
      },
      (departments) {
        state = state.copyWith(
          departments: departments,
          isLoading: false,
          errorMessage: () => null,
        );
      },
    );
  }

  /// Selects an academic department filter (`null` for "All").
  void selectDepartment(String? departmentId) {
    HapticService.selectionClick();
    state = state.copyWith(selectedDepartmentId: () => departmentId);
  }

  /// Updates real-time search query.
  void searchCourses(String query) {
    state = state.copyWith(searchQuery: query);
  }

  /// Pull-to-refresh handler.
  Future<void> refresh() async {
    await loadCourses(forceRefresh: true);
    await HapticService.lightImpact();
  }
}
