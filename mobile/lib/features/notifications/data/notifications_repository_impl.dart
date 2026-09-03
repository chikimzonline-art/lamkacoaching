import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import '../domain/notification_entity.dart';
import '../domain/notifications_repository.dart';
import 'notifications_remote_data_source.dart';

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  final remoteDataSource = ref.watch(notificationsRemoteDataSourceProvider);
  return NotificationsRepositoryImpl(remoteDataSource);
});

class NotificationsRepositoryImpl implements NotificationsRepository {
  final NotificationsRemoteDataSource _remoteDataSource;

  NotificationsRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<NotificationEntity>>> getNotifications({bool all = false}) async {
    try {
      final notifications = await _remoteDataSource.getNotifications(all: all);
      return Right(notifications);
    } on DioException catch (e) {
      return Left(ServerFailure(message: e.message ?? 'Failed to fetch notifications'));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAsRead(List<String> ids) async {
    try {
      await _remoteDataSource.markAsRead(ids);
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(message: e.message ?? 'Failed to mark notifications as read'));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> deleteNotifications(List<String> ids) async {
    try {
      await _remoteDataSource.deleteNotifications(ids);
      return const Right(null);
    } on DioException catch (e) {
      return Left(ServerFailure(message: e.message ?? 'Failed to delete notifications'));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
