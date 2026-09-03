import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/api_constants.dart';
import '../../../core/network/dio_client.dart';
import '../domain/payment_entity.dart';
import '../domain/billing_entity.dart';

final paymentsRepositoryProvider = Provider<PaymentsRepository>((ref) {
  final client = ref.watch(dioClientProvider);
  return PaymentsRepository(client);
});

class PaymentsRepository {
  final DioClient _client;

  PaymentsRepository(this._client);

  /// Creates a Razorpay order from the Next.js backend for cabin or course checkout.
  Future<RazorpayOrderEntity> createOrder({
    required int amountInPaise,
    required String type, // 'cabin' | 'course' | 'cabin_renewal'
    required String itemId, // cabinId or courseId
    String? studentId,
    String? bookingId,
  }) async {
    final notes = <String, dynamic>{
      'type': type,
      'itemId': itemId,
    };
    if (studentId != null) notes['studentId'] = studentId;
    if (bookingId != null) notes['bookingId'] = bookingId;

    final response = await _client.post(
      ApiConstants.createPaymentOrderEndpoint,
      data: {
        'amount': amountInPaise,
        'notes': notes,
      },
    );

    final data = response.data as Map<String, dynamic>;
    if (data['orderId'] != null) {
      return RazorpayOrderEntity(
        orderId: data['orderId'] as String,
        amount: amountInPaise,
        keyId: data['keyId'] as String?,
      );
    }

    throw Exception(data['error'] ?? 'Failed to generate Razorpay order ID');
  }

  /// Creates a renewal order for an active booking.
  Future<RazorpayOrderEntity> createRenewalOrder({
    required String bookingId,
  }) async {
    final response = await _client.post(
      ApiConstants.renewBookingOrderEndpoint,
      data: {'bookingId': bookingId},
    );

    final data = response.data as Map<String, dynamic>;
    if (data['orderId'] != null) {
      return RazorpayOrderEntity(
        orderId: data['orderId'] as String,
        amount: data['amount'] as int? ?? 0,
        currency: data['currency'] as String? ?? 'INR',
        keyId: data['keyId'] as String?,
      );
    }

    throw Exception(data['error'] ?? 'Failed to generate renewal order ID');
  }

  /// Fetches the unified billing summary for the student
  Future<BillingSummaryEntity> getBillingSummary() async {
    final response = await _client.get('/api/student/payments');
    final data = response.data as Map<String, dynamic>;
    return BillingSummaryEntity.fromJson(data);
  }
}
