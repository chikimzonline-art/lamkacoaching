// Payment Domain Entities for Razorpay Checkout

class RazorpayOrderEntity {
  final String orderId;
  final int amount; // in paise
  final String currency;
  final String? keyId;

  const RazorpayOrderEntity({
    required this.orderId,
    required this.amount,
    this.currency = 'INR',
    this.keyId,
  });

  factory RazorpayOrderEntity.fromJson(Map<String, dynamic> json) {
    return RazorpayOrderEntity(
      orderId: json['orderId'] as String? ?? '',
      amount: json['amount'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'INR',
      keyId: json['keyId'] as String?,
    );
  }
}

class PaymentSuccessResult {
  final String paymentId;
  final String? orderId;
  final String? signature;

  const PaymentSuccessResult({
    required this.paymentId,
    this.orderId,
    this.signature,
  });
}

class PaymentFailureResult {
  final int code;
  final String message;

  const PaymentFailureResult({
    required this.code,
    required this.message,
  });
}

class PaymentException implements Exception {
  final int code;
  final String message;

  const PaymentException({
    required this.code,
    required this.message,
  });

  @override
  String toString() => message;
}
