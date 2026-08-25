// Payment Domain Entities for Razorpay Checkout

class RazorpayOrderEntity {
  final String orderId;
  final int amount; // in paise
  final String currency;

  const RazorpayOrderEntity({
    required this.orderId,
    required this.amount,
    this.currency = 'INR',
  });

  factory RazorpayOrderEntity.fromJson(Map<String, dynamic> json) {
    return RazorpayOrderEntity(
      orderId: json['orderId'] as String? ?? '',
      amount: json['amount'] as int? ?? 0,
      currency: json['currency'] as String? ?? 'INR',
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
