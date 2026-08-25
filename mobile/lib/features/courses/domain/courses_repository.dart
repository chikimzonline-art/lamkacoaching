import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import 'course_entity.dart';

/// Abstract repository contract for Course Explorer.
abstract class CoursesRepository {
  Future<Either<Failure, List<DepartmentEntity>>> getCoursesCategorized();
}
