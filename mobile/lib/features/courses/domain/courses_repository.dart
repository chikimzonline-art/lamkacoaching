import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import 'course_entity.dart';

/// Abstract repository contract for Course Explorer and Enrollment.
abstract class CoursesRepository {
  Future<Either<Failure, List<DepartmentEntity>>> getCoursesCategorized();
  Future<String> createEnrollmentDraft({required String courseId, required String batchId});
  Future<void> cancelEnrollmentDraft(String enrollmentId);
  Future<bool> joinCourseWaitlist(String courseId);
  Future<bool> checkWaitlistStatus(String courseId);
}
