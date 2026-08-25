import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import 'student_dashboard_entity.dart';

/// Abstract repository interface for student dashboard data.
abstract class DashboardRepository {
  Future<Either<Failure, StudentDashboardSummary>> getStudentDashboard(String studentId);
  Future<Either<Failure, List<NoticeEntity>>> getPublicNotices();
}
