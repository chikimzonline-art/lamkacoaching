import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/notification_entity.dart';

final notificationsRemoteDataSourceProvider = Provider<NotificationsRemoteDataSource>((ref) {
  final dio = ref.watch(dioProvider);
  return NotificationsRemoteDataSource(dio);
});

class NotificationsRemoteDataSource {
  final Dio _dio;

  NotificationsRemoteDataSource(this._dio);

  Future<List<NotificationEntity>> getNotifications({bool all = false}) async {
    final response = await _dio.get(
      ApiConstants.notificationsEndpoint,
      queryParameters: {'all': all},
    );

    if (response.data == null) {
      return <NotificationEntity>[];
    }
    
    final notificationsList = response.data['notifications'] as List<dynamic>? ?? [];
    return notificationsList
        .map((e) => NotificationEntity.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> markAsRead(List<String> ids) async {
    await _dio.post(
      ApiConstants.notificationsEndpoint,
      data: {'ids': ids},
    );
  }

  Future<void> deleteNotifications(List<String> ids) async {
    await _dio.delete(
      ApiConstants.notificationsEndpoint,
      data: {'ids': ids},
    );
  }
}
