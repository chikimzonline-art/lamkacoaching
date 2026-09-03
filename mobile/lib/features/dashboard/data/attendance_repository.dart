import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../domain/attendance_history_entity.dart';

class AttendanceScanResult {
  final bool success;
  final String message;
  final bool alreadyCheckedIn;
  final int? durationMinutes;
  final String? cabinNum;
  final int? floor;
  final DateTime? timestamp;

  const AttendanceScanResult({
    required this.success,
    required this.message,
    this.alreadyCheckedIn = false,
    this.durationMinutes,
    this.cabinNum,
    this.floor,
    this.timestamp,
  });
}

final attendanceRepositoryProvider = Provider<AttendanceRepository>((ref) {
  final client = ref.watch(dioClientProvider);
  return AttendanceRepository(client);
});

class AttendanceRepository {
  final DioClient _client;

  AttendanceRepository(this._client);

  /// Submits desk QR payload for student self check-in or check-out.
  Future<AttendanceScanResult> submitDeskScan({
    required String action, // 'checkin' | 'checkout'
    required String deskQrPayload,
  }) async {
    // Parse desk info if present in QR
    String? cabinNum;
    int? floor;
    try {
      final parsed = jsonDecode(deskQrPayload);
      if (parsed is Map<String, dynamic>) {
        cabinNum = parsed['cabinNum']?.toString();
        floor = parsed['floor'] as int?;
      }
    } catch (_) {
      // Ignored, server validates payload
    }

    try {
      final response = await _client.post(
        ApiConstants.attendanceSelfEndpoint,
        data: {
          'action': action,
          'deskQrPayload': deskQrPayload,
        },
      );

      final data = response.data as Map<String, dynamic>;
      return AttendanceScanResult(
        success: data['success'] == true,
        message: data['message'] as String? ?? 'Attendance recorded successfully',
        durationMinutes: data['durationMinutes'] as int?,
        cabinNum: cabinNum,
        floor: floor,
        timestamp: DateTime.now(),
      );
    } on DioException catch (e) {
      final resData = e.response?.data;
      if (resData is Map<String, dynamic>) {
        final errorMsg = resData['error'] as String? ?? 'Failed to record attendance';
        final isAlreadyCheckedIn = errorMsg.toLowerCase().contains('already checked in');
        return AttendanceScanResult(
          success: false,
          message: errorMsg,
          alreadyCheckedIn: isAlreadyCheckedIn,
          cabinNum: cabinNum,
          floor: floor,
        );
      }
      return AttendanceScanResult(
        success: false,
        message: e.message ?? 'Network connection error',
        cabinNum: cabinNum,
        floor: floor,
      );
    } catch (e) {
      return AttendanceScanResult(
        success: false,
        message: e.toString().replaceAll('Exception: ', ''),
        cabinNum: cabinNum,
        floor: floor,
      );
    }
  }

  /// Fetches the student's attendance records and study hour metrics.
  Future<AttendanceHistoryResponse> fetchAttendanceHistory({int limit = 60}) async {
    final response = await _client.get(
      ApiConstants.attendanceSelfEndpoint,
      queryParameters: {'limit': limit},
    );
    final data = response.data as Map<String, dynamic>;
    return AttendanceHistoryResponse.fromJson(data);
  }
}

final attendanceHistoryFutureProvider =
    FutureProvider.autoDispose<AttendanceHistoryResponse>((ref) async {
  final repo = ref.watch(attendanceRepositoryProvider);
  return repo.fetchAttendanceHistory();
});
