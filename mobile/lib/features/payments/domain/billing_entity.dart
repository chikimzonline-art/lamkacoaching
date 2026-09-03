class PendingDueEntity {
  final String id;
  final String type; // 'enrollment' or 'booking'
  final String itemId;
  final String itemName;
  final String? departmentName;
  final String? bookingType;
  final double totalAmount;
  final double paidAmount;
  final double balance;
  final String status;

  const PendingDueEntity({
    required this.id,
    required this.type,
    required this.itemId,
    required this.itemName,
    this.departmentName,
    this.bookingType,
    required this.totalAmount,
    required this.paidAmount,
    required this.balance,
    required this.status,
  });

  factory PendingDueEntity.fromJson(Map<String, dynamic> json) {
    return PendingDueEntity(
      id: json['id'] as String,
      type: json['type'] as String,
      itemId: json['itemId'] as String,
      itemName: json['itemName'] as String,
      departmentName: json['departmentName'] as String?,
      bookingType: json['bookingType'] as String?,
      totalAmount: (json['totalAmount'] as num).toDouble(),
      paidAmount: (json['paidAmount'] as num).toDouble(),
      balance: (json['balance'] as num).toDouble(),
      status: json['status'] as String,
    );
  }
}

class TransactionEntity {
  final String id;
  final String type; // 'enrollment' or 'booking'
  final double amount;
  final String mode;
  final String status;
  final DateTime date;
  final String? receiptNo;
  final String itemName;
  final String itemDetail;

  const TransactionEntity({
    required this.id,
    required this.type,
    required this.amount,
    required this.mode,
    required this.status,
    required this.date,
    this.receiptNo,
    required this.itemName,
    required this.itemDetail,
  });

  factory TransactionEntity.fromJson(Map<String, dynamic> json) {
    return TransactionEntity(
      id: json['id'] as String,
      type: json['type'] as String,
      amount: (json['amount'] as num).toDouble(),
      mode: json['mode'] as String,
      status: json['status'] as String,
      date: DateTime.parse(json['date'] as String),
      receiptNo: json['receiptNo'] as String?,
      itemName: json['itemName'] as String,
      itemDetail: json['itemDetail'] as String,
    );
  }
}

class BillingSummaryEntity {
  final List<PendingDueEntity> pendingDues;
  final List<TransactionEntity> pastPayments;

  const BillingSummaryEntity({
    this.pendingDues = const [],
    this.pastPayments = const [],
  });

  factory BillingSummaryEntity.fromJson(Map<String, dynamic> json) {
    return BillingSummaryEntity(
      pendingDues: (json['pendingDues'] as List<dynamic>?)
              ?.map((e) => PendingDueEntity.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      pastPayments: (json['pastPayments'] as List<dynamic>?)
              ?.map((e) => TransactionEntity.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}
