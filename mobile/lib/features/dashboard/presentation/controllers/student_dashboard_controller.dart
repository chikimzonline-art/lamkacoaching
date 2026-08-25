import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/haptic_service.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../data/dashboard_repository_impl.dart';
import '../../domain/dashboard_repository.dart';
import '../../domain/student_dashboard_entity.dart';

/// Riverpod provider for the [StudentDashboardNotifier].
final studentDashboardControllerProvider = StateNotifierProvider<
    StudentDashboardNotifier, AsyncValue<StudentDashboardSummary>>((ref) {
  final repository = ref.watch(dashboardRepositoryProvider);
  final authState = ref.watch(authNotifierProvider);
  final userId = authState.user?.id ?? '';
  return StudentDashboardNotifier(repository, userId);
});

/// Controller handling student timeline, notices, and cabin booking state.
class StudentDashboardNotifier
    extends StateNotifier<AsyncValue<StudentDashboardSummary>> {
  final DashboardRepository _repository;
  final String _userId;

  StudentDashboardNotifier(this._repository, this._userId)
      : super(const AsyncValue.loading()) {
    if (_userId.isNotEmpty) {
      loadDashboard();
    } else {
      // Fallback empty summary
      state = const AsyncValue.data(StudentDashboardSummary());
    }
  }

  /// Fetches the aggregated dashboard summary.
  Future<void> loadDashboard({bool forceRefresh = false}) async {
    if (!forceRefresh && state.hasValue && state.value!.hasActiveEnrollments) {
      return;
    }

    if (!state.hasValue) {
      state = const AsyncValue.loading();
    }

    final result = await _repository.getStudentDashboard(_userId);
    result.fold(
      (failure) {
        state = AsyncValue.error(failure.message, StackTrace.current);
      },
      (summary) {
        state = AsyncValue.data(summary);
      },
    );
  }

  /// Pull-to-refresh handler with haptic feedback.
  Future<void> refresh() async {
    await loadDashboard(forceRefresh: true);
    await HapticService.lightImpact();
  }
}
