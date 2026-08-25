import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/student_dashboard_entity.dart';

/// Riverpod provider for [DashboardRemoteDataSource].
final dashboardRemoteDataSourceProvider = Provider<DashboardRemoteDataSource>((ref) {
  final dio = ref.watch(dioProvider);
  return DashboardRemoteDataSourceImpl(dio);
});

/// Abstract data source defining dashboard remote API contracts.
abstract class DashboardRemoteDataSource {
  Future<List<EnrollmentEntity>> fetchStudentEnrollments();
  Future<List<NoticeEntity>> fetchPublicNotices();
  Future<ActiveDeskBookingEntity?> fetchActiveDeskBooking(String studentId);
  Future<StudentDashboardSummary> getDashboardSummary(String studentId);
}

/// Production implementation of [DashboardRemoteDataSource] over Dio.
class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  final Dio _dio;

  DashboardRemoteDataSourceImpl(this._dio);

  @override
  Future<List<EnrollmentEntity>> fetchStudentEnrollments() async {
    try {
      final response = await _dio.get(ApiConstants.studentEnrollmentsEndpoint);
      if (response.data == null) return [];

      final data = response.data as Map<String, dynamic>;
      final rawList = data['enrollments'] as List<dynamic>? ?? [];
      return rawList
          .map((e) => EnrollmentEntity.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<List<NoticeEntity>> fetchPublicNotices() async {
    try {
      final response = await _dio.get(ApiConstants.publicNoticesEndpoint);
      if (response.data == null) return [];

      final data = response.data as Map<String, dynamic>;
      final rawList = data['notices'] as List<dynamic>? ?? [];
      return rawList
          .map((n) => NoticeEntity.fromJson(n as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  @override
  Future<ActiveDeskBookingEntity?> fetchActiveDeskBooking(String studentId) async {
    try {
      final response = await _dio.get(
        ApiConstants.bookingsEndpoint,
        queryParameters: {'studentId': studentId, 'status': 'active'},
      );
      if (response.data == null) return null;

      final data = response.data as Map<String, dynamic>;
      final rawList = data['bookings'] as List<dynamic>? ?? [];
      if (rawList.isEmpty) return null;

      return ActiveDeskBookingEntity.fromJson(rawList.first as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<StudentDashboardSummary> getDashboardSummary(String studentId) async {
    final results = await Future.wait([
      fetchStudentEnrollments(),
      fetchPublicNotices(),
      fetchActiveDeskBooking(studentId),
    ]);

    final enrollments = results[0] as List<EnrollmentEntity>;
    final notices = results[1] as List<NoticeEntity>;
    final activeBooking = results[2] as ActiveDeskBookingEntity?;

    final scheduleItems = _deriveTodaySchedule(enrollments);

    return StudentDashboardSummary(
      enrollments: enrollments,
      todaySchedule: scheduleItems,
      notices: notices,
      activeBooking: activeBooking,
    );
  }

  List<StudentScheduleItem> _deriveTodaySchedule(List<EnrollmentEntity> enrollments) {
    if (enrollments.isEmpty) return [];

    final now = DateTime.now();
    final currentHour = now.hour;
    final currentMinute = now.minute;
    final currentTimeInMinutes = currentHour * 60 + currentMinute;

    final schedule = <StudentScheduleItem>[];

    for (int i = 0; i < enrollments.length; i++) {
      final e = enrollments[i];
      if (!e.isActive) continue;

      final timingStr = e.batchTiming ?? '10:00 AM - 12:00 PM';
      String status = 'upcoming';

      // Parse status roughly based on time slot
      if (timingStr.toLowerCase().contains('morning') || timingStr.contains('06:') || timingStr.contains('07:') || timingStr.contains('08:') || timingStr.contains('09:')) {
        if (currentTimeInMinutes > 12 * 60) {
          status = 'completed';
        } else if (currentTimeInMinutes >= 8 * 60 && currentTimeInMinutes <= 12 * 60) {
          status = 'in_session';
        } else {
          status = 'upcoming';
        }
      } else if (timingStr.toLowerCase().contains('evening') || timingStr.contains('03:') || timingStr.contains('04:') || timingStr.contains('05:') || timingStr.contains('06:')) {
        if (currentTimeInMinutes < 15 * 60) {
          status = 'upcoming';
        } else if (currentTimeInMinutes >= 15 * 60 && currentTimeInMinutes <= 18 * 60) {
          status = 'in_session';
        } else {
          status = 'completed';
        }
      } else {
        if (currentTimeInMinutes >= 10 * 60 && currentTimeInMinutes <= 13 * 60) {
          status = 'in_session';
        } else if (currentTimeInMinutes > 13 * 60) {
          status = 'completed';
        } else {
          status = 'upcoming';
        }
      }

      schedule.add(
        StudentScheduleItem(
          id: 'sched_${e.id}_$i',
          subject: e.courseName,
          batchName: e.batchName ?? 'Regular Batch',
          timing: timingStr,
          roomOrCabin: 'Room ${101 + (i % 5)} (Main Hall)',
          instructor: 'Faculty Staff',
          status: status,
        ),
      );
    }

    return schedule;
  }
}
