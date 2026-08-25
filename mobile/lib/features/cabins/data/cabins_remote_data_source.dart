import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../domain/cabin_entity.dart';

class CabinsRemoteDataSource {
  final DioClient _client;

  CabinsRemoteDataSource(this._client);

  /// Fetches complete cabins dashboard state.
  Future<StudentCabinDashboardData> fetchStudentCabins() async {
    try {
      final response = await _client.get(ApiConstants.studentCabinsEndpoint);
      if (response.data is Map<String, dynamic>) {
        return StudentCabinDashboardData.fromJson(
            response.data as Map<String, dynamic>);
      }
    } catch (_) {
      // Fallback below
    }

    // Graceful fallback to public cabins endpoint if unauthenticated or on error
    try {
      final publicRes = await _client.get(ApiConstants.publicCabinsEndpoint);
      if (publicRes.data is Map<String, dynamic>) {
        return StudentCabinDashboardData.fromJson(
            publicRes.data as Map<String, dynamic>);
      }
      throw Exception('Invalid server response format from public cabins');
    } catch (e) {
      rethrow;
    }
  }

  /// Reserves a cabin desk temporarily (10-minute hold)
  Future<({String bookingId, int totalAmount})> reserveCabin({
    required String cabinId,
    required String bookingType,
    required String startDate,
  }) async {
    final response = await _client.post(
      ApiConstants.studentCabinsEndpoint,
      data: {
        'cabinId': cabinId,
        'bookingType': bookingType,
        'startDate': startDate,
      },
    );

    final data = response.data as Map<String, dynamic>;
    if (data['success'] == true && data['bookingId'] != null) {
      return (
        bookingId: data['bookingId'] as String,
        totalAmount: data['totalAmount'] as int? ?? 0,
      );
    }

    throw Exception(data['error'] ?? 'Failed to reserve cabin');
  }

  /// Cancels a pending booking.
  Future<void> cancelPendingBooking(String bookingId) async {
    await _client.delete(
      ApiConstants.studentCabinsEndpoint,
      queryParameters: {'bookingId': bookingId},
    );
  }

  /// Renews an active booking.
  Future<void> renewBooking(String bookingId) async {
    await _client.post(
      ApiConstants.bookingsEndpoint,
      data: {
        'action': 'renew',
        'id': bookingId,
      },
    );
  }
}
