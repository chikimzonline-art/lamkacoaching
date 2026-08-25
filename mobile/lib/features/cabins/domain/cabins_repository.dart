import 'cabin_entity.dart';

abstract class CabinsRepository {
  /// Fetches complete cabins dashboard state including live availability, pricing, and active bookings.
  Future<StudentCabinDashboardData> fetchStudentCabins();

  /// Reserves a cabin desk temporarily (10-minute hold) and returns the created booking ID and total amount.
  Future<({String bookingId, int totalAmount})> reserveCabin({
    required String cabinId,
    required String bookingType,
    required String startDate,
  });

  /// Cancels a pending booking to immediately release the hold.
  Future<void> cancelPendingBooking(String bookingId);

  /// Renews an active booking.
  Future<void> renewBooking(String bookingId);
}
