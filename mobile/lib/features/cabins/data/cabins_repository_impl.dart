import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_client.dart';
import '../domain/cabin_entity.dart';
import '../domain/cabins_repository.dart';
import 'cabins_remote_data_source.dart';

final cabinsRemoteDataSourceProvider = Provider<CabinsRemoteDataSource>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return CabinsRemoteDataSource(dioClient);
});

final cabinsRepositoryProvider = Provider<CabinsRepository>((ref) {
  final dataSource = ref.watch(cabinsRemoteDataSourceProvider);
  return CabinsRepositoryImpl(dataSource);
});

class CabinsRepositoryImpl implements CabinsRepository {
  final CabinsRemoteDataSource _remoteDataSource;

  CabinsRepositoryImpl(this._remoteDataSource);

  @override
  Future<StudentCabinDashboardData> fetchStudentCabins() async {
    return await _remoteDataSource.fetchStudentCabins();
  }

  @override
  Future<({String bookingId, int totalAmount})> reserveCabin({
    required String cabinId,
    required String bookingType,
    required String startDate,
  }) async {
    return await _remoteDataSource.reserveCabin(
      cabinId: cabinId,
      bookingType: bookingType,
      startDate: startDate,
    );
  }

  @override
  Future<void> cancelPendingBooking(String bookingId) async {
    await _remoteDataSource.cancelPendingBooking(bookingId);
  }

  @override
  Future<void> renewBooking(String bookingId) async {
    await _remoteDataSource.renewBooking(bookingId);
  }
}
