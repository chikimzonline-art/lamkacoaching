import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import '../domain/course_entity.dart';
import '../domain/courses_repository.dart';
import 'courses_remote_data_source.dart';

/// Riverpod provider for [CoursesRepository].
final coursesRepositoryProvider = Provider<CoursesRepository>((ref) {
  final remoteDataSource = ref.watch(coursesRemoteDataSourceProvider);
  return CoursesRepositoryImpl(remoteDataSource);
});

/// Production implementation of [CoursesRepository].
class CoursesRepositoryImpl implements CoursesRepository {
  final CoursesRemoteDataSource _remoteDataSource;

  CoursesRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, List<DepartmentEntity>>> getCoursesCategorized() async {
    try {
      final departments = await _remoteDataSource.fetchCoursesCategorized();
      return Right(departments);
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<String> createEnrollmentDraft({required String courseId, required String batchId}) {
    return _remoteDataSource.createEnrollmentDraft(courseId: courseId, batchId: batchId);
  }

  @override
  Future<void> cancelEnrollmentDraft(String enrollmentId) {
    return _remoteDataSource.cancelEnrollmentDraft(enrollmentId);
  }

  @override
  Future<bool> joinCourseWaitlist(String courseId) {
    return _remoteDataSource.joinCourseWaitlist(courseId);
  }

  @override
  Future<bool> checkWaitlistStatus(String courseId) {
    return _remoteDataSource.checkWaitlistStatus(courseId);
  }
}
