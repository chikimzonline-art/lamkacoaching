import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/payments_repository.dart';
import '../../domain/billing_entity.dart';

final paymentsControllerProvider = StateNotifierProvider<PaymentsController, AsyncValue<BillingSummaryEntity>>((ref) {
  final repository = ref.watch(paymentsRepositoryProvider);
  return PaymentsController(repository);
});

class PaymentsController extends StateNotifier<AsyncValue<BillingSummaryEntity>> {
  final PaymentsRepository _repository;

  PaymentsController(this._repository) : super(const AsyncValue.loading()) {
    loadBillingSummary();
  }

  Future<void> loadBillingSummary() async {
    state = const AsyncValue.loading();
    try {
      final summary = await _repository.getBillingSummary();
      state = AsyncValue.data(summary);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() async {
    await loadBillingSummary();
  }
}
