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

/// Abstract data source for fetching public course catalog.
abstract class CoursesRemoteDataSource {
  Future<List<DepartmentEntity>> fetchCoursesCategorized();
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
}
