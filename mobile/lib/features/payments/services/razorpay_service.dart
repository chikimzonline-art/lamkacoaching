import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/utils/formatters.dart';
import '../domain/payment_entity.dart';

final razorpayServiceProvider = Provider<RazorpayService>((ref) {
  final service = RazorpayService();
  ref.onDispose(() => service.dispose());
  return service;
});

/// Production Razorpay integration service with desktop mock support.
class RazorpayService {
  Razorpay? _razorpay;
  bool _isInitialized = false;
  Completer<PaymentSuccessResult>? _checkoutCompleter;

  void initialize() {
    if (_isInitialized) return;
    if (!kIsWeb && (Platform.isAndroid || Platform.isIOS)) {
      _razorpay = Razorpay();
      _razorpay!.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
      _razorpay!.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
      _razorpay!.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    }
    _isInitialized = true;
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    debugPrint('[Razorpay SDK] Payment Success: ${response.paymentId}');
    if (_checkoutCompleter != null && !_checkoutCompleter!.isCompleted) {
      _checkoutCompleter!.complete(
        PaymentSuccessResult(
          paymentId: response.paymentId ?? '',
          orderId: response.orderId,
          signature: response.signature,
        ),
      );
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    debugPrint('[Razorpay SDK] Payment Failure: [${response.code}] ${response.message}');
    if (_checkoutCompleter != null && !_checkoutCompleter!.isCompleted) {
      _checkoutCompleter!.completeError(
        PaymentException(
          code: response.code ?? -1,
          message: response.message ?? 'Payment cancelled or failed',
        ),
      );
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    debugPrint('[Razorpay SDK] External Wallet: ${response.walletName}');
    if (_checkoutCompleter != null && !_checkoutCompleter!.isCompleted) {
      _checkoutCompleter!.completeError(
        PaymentException(
          code: 0,
          message: 'External wallet selected (${response.walletName}). Please complete payment in the respective app.',
        ),
      );
    }
  }

  /// Opens the native Razorpay checkout or triggers the desktop mock simulation.
  Future<PaymentSuccessResult> openCheckout({
    required String orderId,
    required int amountInPaise,
    required String name,
    required String description,
    required Map<String, dynamic> notes,
    required String customerName,
    required String customerPhone,
    String? customerEmail,
    String? keyId,
  }) async {
    initialize();

    // On Linux / Windows Desktop or Web, simulate payment lifecycle for developer testing
    if (kIsWeb || (!Platform.isAndroid && !Platform.isIOS)) {
      debugPrint('[Razorpay Mock] Launching mock payment checkout for Order: $orderId, Amount: ${Formatters.formatPaiseToRupees(amountInPaise)}');
      
      // Simulate user interaction delay
      await Future.delayed(const Duration(seconds: 2));

      final mockPaymentId = 'pay_mock_${DateTime.now().millisecondsSinceEpoch}';
      debugPrint('[Razorpay Mock] Mock payment success: $mockPaymentId');

      return PaymentSuccessResult(
        paymentId: mockPaymentId,
        orderId: orderId,
        signature: 'mock_sig_${DateTime.now().millisecondsSinceEpoch}',
      );
    }

    // On Mobile Platforms (Android / iOS): Open native Razorpay SDK checkout
    _checkoutCompleter = Completer<PaymentSuccessResult>();

    final options = <String, dynamic>{
      'key': (keyId != null && keyId.isNotEmpty) ? keyId : ApiConstants.razorpayKey,
      'amount': amountInPaise,
      'name': name,
      'description': description,
      'order_id': orderId,
      'notes': notes,
      'prefill': {
        'contact': customerPhone,
        'email': customerEmail ?? '',
        'name': customerName,
      },
      'theme': {
        'color': '#06b6d4', // Cyan 500 brand color matching web
      },
      'external': {
        'wallets': ['paytm'],
      },
    };

    try {
      _razorpay!.open(options);
    } catch (e) {
      debugPrint('[Razorpay SDK] Error opening checkout: $e');
      if (!_checkoutCompleter!.isCompleted) {
        _checkoutCompleter!.completeError(
          PaymentException(code: -1, message: 'Could not open Razorpay checkout: $e'),
        );
      }
    }

    return _checkoutCompleter!.future;
  }

  void dispose() {
    _razorpay?.clear();
    _razorpay = null;
    _isInitialized = false;
  }
}
