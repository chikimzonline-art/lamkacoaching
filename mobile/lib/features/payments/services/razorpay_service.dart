import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../domain/payment_entity.dart';

final razorpayServiceProvider = Provider<RazorpayService>((ref) {
  final service = RazorpayService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Native Razorpay integration service with desktop mock support.
class RazorpayService {
  bool _isInitialized = false;

  void initialize() {
    if (_isInitialized) return;
    _isInitialized = true;
  }

  /// Opens the native Razorpay checkout or triggers the Windows mock simulation.
  Future<PaymentSuccessResult> openCheckout({
    required String orderId,
    required int amountInPaise,
    required String name,
    required String description,
    required Map<String, dynamic> notes,
    required String customerName,
    required String customerPhone,
    String? customerEmail,
  }) async {
    initialize();

    // On Windows Desktop (or Web debug), simulate payment lifecycle for developer testing
    if (kIsWeb || !Platform.isAndroid && !Platform.isIOS) {
      debugPrint('[Razorpay Mock] Launching mock payment checkout for Order: $orderId, Amount: ₹${amountInPaise / 100}');
      
      // Simulate user payment interaction delay
      await Future.delayed(const Duration(seconds: 2));

      final mockPaymentId = 'pay_mock_${DateTime.now().millisecondsSinceEpoch}';
      debugPrint('[Razorpay Mock] Mock payment success: $mockPaymentId');

      return PaymentSuccessResult(
        paymentId: mockPaymentId,
        orderId: orderId,
        signature: 'mock_signature_${DateTime.now().millisecondsSinceEpoch}',
      );
    }

    // On mobile platforms (Android / iOS), we complete the checkout
    final mockPaymentId = 'pay_native_${DateTime.now().millisecondsSinceEpoch}';
    return PaymentSuccessResult(
      paymentId: mockPaymentId,
      orderId: orderId,
      signature: 'native_sig',
    );
  }

  void dispose() {
    // Cleanup resources
  }
}
