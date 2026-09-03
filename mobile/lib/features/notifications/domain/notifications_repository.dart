import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import 'notification_entity.dart';

/// Repository interface for fetching and managing user notifications.
abstract class NotificationsRepository {
  /// Fetches all notifications for the currently logged in student.
  /// If [all] is true, fetches all notifications, otherwise fetches only unread.
  Future<Either<Failure, List<NotificationEntity>>> getNotifications({bool all = false});

  /// Marks a specific list of notifications as read.
  /// If [ids] is empty or null, it should mark all unread notifications as read.
  Future<Either<Failure, void>> markAsRead(List<String> ids);

  /// Deletes a specific list of notifications.
  /// If [ids] is empty or null, it should delete all notifications for the user.
  Future<Either<Failure, void>> deleteNotifications(List<String> ids);
}
