import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/network/dio_client.dart';
import '../domain/course_entity.dart';

/// Riverpod provider for [CoursesRemoteDataSource].
final coursesRemoteDataSourceProvider = Provider<CoursesRemoteDataSource>((ref) {
  final dio = ref.watch(dioProvider);
  return CoursesRemoteDataSourceImpl(dio);
});

/// Abstract data source for fetching public course catalog and managing enrollments/waitlists.
abstract class CoursesRemoteDataSource {
  Future<List<DepartmentEntity>> fetchCoursesCategorized();
  Future<String> createEnrollmentDraft({required String courseId, required String batchId});
  Future<void> cancelEnrollmentDraft(String enrollmentId);
  Future<bool> joinCourseWaitlist(String courseId);
  Future<bool> checkWaitlistStatus(String courseId);
}

/// Production implementation of [CoursesRemoteDataSource] over Dio.
class CoursesRemoteDataSourceImpl implements CoursesRemoteDataSource {
  final Dio _dio;

  CoursesRemoteDataSourceImpl(this._dio);

  @override
  Future<List<DepartmentEntity>> fetchCoursesCategorized() async {
    try {
      final response = await _dio.get(ApiConstants.publicCoursesEndpoint);
      if (response.data == null) return [];

      final data = response.data as Map<String, dynamic>;
      final rawDepartments = data['departments'] as List<dynamic>? ?? [];

      return rawDepartments
          .map((d) => DepartmentEntity.fromJson(d as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch courses: $e');
    }
  }

  @override
  Future<String> createEnrollmentDraft({required String courseId, required String batchId}) async {
    try {
      final response = await _dio.post(
        ApiConstants.studentEnrollmentsEndpoint,
        data: {'courseId': courseId, 'batchId': batchId},
      );
      if (response.data != null && response.data['enrollmentId'] != null) {
        return response.data['enrollmentId'] as String;
      }
      throw Exception(response.data?['error'] ?? 'Failed to create enrollment');
    } on DioException catch (e) {
      final errorMsg = e.response?.data?['error'] ?? e.message;
      throw Exception(errorMsg);
    } catch (e) {
      throw Exception('Enrollment failed: $e');
    }
  }

  @override
  Future<void> cancelEnrollmentDraft(String enrollmentId) async {
    try {
      await _dio.delete(
        ApiConstants.studentEnrollmentsEndpoint,
        data: {'enrollmentId': enrollmentId},
      );
    } catch (_) {
      // Best effort cleanup; QStash worker clears abandoned drafts
    }
  }

  @override
  Future<bool> joinCourseWaitlist(String courseId) async {
    try {
      final response = await _dio.post(
        ApiConstants.studentWaitlistEndpoint,
        data: {'courseId': courseId},
      );
      return response.data?['waitlisted'] == true;
    } on DioException catch (e) {
      final errorMsg = e.response?.data?['error'] ?? e.message;
      throw Exception(errorMsg);
    } catch (e) {
      throw Exception('Failed to join waitlist: $e');
    }
  }

  @override
  Future<bool> checkWaitlistStatus(String courseId) async {
    try {
      final response = await _dio.get(
        ApiConstants.studentWaitlistEndpoint,
        queryParameters: {'courseId': courseId},
      );
      return response.data?['waitlisted'] == true;
    } catch (_) {
      return false;
    }
  }
}
