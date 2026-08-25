import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import '../domain/dashboard_repository.dart';
import '../domain/student_dashboard_entity.dart';
import 'dashboard_remote_data_source.dart';

/// Riverpod provider for [DashboardRepository].
final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  final remoteDataSource = ref.watch(dashboardRemoteDataSourceProvider);
  return DashboardRepositoryImpl(remoteDataSource);
});

/// Production implementation of [DashboardRepository].
class DashboardRepositoryImpl implements DashboardRepository {
  final DashboardRemoteDataSource _remoteDataSource;

  DashboardRepositoryImpl(this._remoteDataSource);

  @override
  Future<Either<Failure, StudentDashboardSummary>> getStudentDashboard(String studentId) async {
    try {
      final summary = await _remoteDataSource.getDashboardSummary(studentId);
      return Right(summary);
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<NoticeEntity>>> getPublicNotices() async {
    try {
      final notices = await _remoteDataSource.fetchPublicNotices();
      return Right(notices);
    } catch (e) {
      return Left(UnknownFailure(message: e.toString()));
    }
  }
}
