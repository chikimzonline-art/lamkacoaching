import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/notification_entity.dart';
import '../../domain/notifications_repository.dart';
import '../../data/notifications_repository_impl.dart';

final notificationsControllerProvider =
    StateNotifierProvider<NotificationsController, AsyncValue<List<NotificationEntity>>>((ref) {
  final repository = ref.watch(notificationsRepositoryProvider);
  return NotificationsController(repository);
});

class NotificationsController extends StateNotifier<AsyncValue<List<NotificationEntity>>> {
  final NotificationsRepository _repository;

  NotificationsController(this._repository) : super(const AsyncValue.loading()) {
    fetchNotifications();
  }

  Future<void> fetchNotifications({bool all = true}) async {
    state = const AsyncValue.loading();
    final result = await _repository.getNotifications(all: all);

    result.fold(
      (failure) => state = AsyncValue.error(failure.message, StackTrace.current),
      (notifications) => state = AsyncValue.data(notifications),
    );
  }

  Future<void> markAsRead(List<String> ids) async {
    final result = await _repository.markAsRead(ids);
    
    // Optimistic update
    if (result.isRight && state.hasValue) {
      final currentList = state.value!;
      final updatedList = currentList.map((notification) {
        if (ids.isEmpty || ids.contains(notification.id)) {
          return notification.copyWith(read: true);
        }
        return notification;
      }).toList();
      state = AsyncValue.data(updatedList);
    }
  }

  Future<void> deleteNotifications(List<String> ids) async {
    final result = await _repository.deleteNotifications(ids);
    
    // Optimistic update
    if (result.isRight && state.hasValue) {
      final currentList = state.value!;
      final updatedList = currentList.where((notification) {
        if (ids.isEmpty) return false; // Empty means delete all
        return !ids.contains(notification.id);
      }).toList();
      state = AsyncValue.data(updatedList);
    }
  }
}
