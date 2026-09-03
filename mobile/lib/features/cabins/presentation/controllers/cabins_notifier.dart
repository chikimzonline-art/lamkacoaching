import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/cabins_repository_impl.dart';
import '../../domain/cabin_entity.dart';
import '../../domain/cabins_repository.dart';

class CabinsState {
  final AsyncValue<StudentCabinDashboardData> dashboardData;
  final int? selectedFloor; // null means 'All Floors'
  final bool showAvailableOnly;

  const CabinsState({
    required this.dashboardData,
    this.selectedFloor,
    this.showAvailableOnly = false,
  });

  CabinsState copyWith({
    AsyncValue<StudentCabinDashboardData>? dashboardData,
    int? selectedFloor,
    bool? showAvailableOnly,
    bool clearFloor = false,
  }) {
    return CabinsState(
      dashboardData: dashboardData ?? this.dashboardData,
      selectedFloor: clearFloor ? null : (selectedFloor ?? this.selectedFloor),
      showAvailableOnly: showAvailableOnly ?? this.showAvailableOnly,
    );
  }

  List<CabinEntity> get filteredCabins {
    final data = dashboardData.valueOrNull;
    if (data == null) return [];
    var cabins = data.cabins;
    if (selectedFloor != null) {
      cabins = cabins.where((c) => c.floor == selectedFloor).toList();
    }
    if (showAvailableOnly) {
      cabins = cabins.where((c) => c.hasAvailableShift).toList();
    }
    return cabins;
  }
}

final cabinsNotifierProvider =
    StateNotifierProvider.autoDispose<CabinsNotifier, CabinsState>((ref) {
  final repository = ref.watch(cabinsRepositoryProvider);
  return CabinsNotifier(repository);
});

class CabinsNotifier extends StateNotifier<CabinsState> {
  final CabinsRepository _repository;

  CabinsNotifier(this._repository)
      : super(const CabinsState(dashboardData: AsyncValue.loading())) {
    loadCabins();
  }

  Future<void> loadCabins() async {
    state = state.copyWith(dashboardData: const AsyncValue.loading());
    try {
      final data = await _repository.fetchStudentCabins();
      state = state.copyWith(dashboardData: AsyncValue.data(data));
    } catch (e, st) {
      state = state.copyWith(dashboardData: AsyncValue.error(e, st));
    }
  }

  void selectFloor(int? floor) {
    if (floor == null) {
      state = state.copyWith(clearFloor: true);
    } else {
      state = state.copyWith(selectedFloor: floor);
    }
  }

  void toggleAvailableOnly() {
    state = state.copyWith(showAvailableOnly: !state.showAvailableOnly);
  }

  Future<void> cancelPendingCheckout(String bookingId) async {
    try {
      await _repository.cancelPendingBooking(bookingId);
      await loadCabins();
    } catch (_) {
      // Reload anyway to sync
      await loadCabins();
    }
  }
}
