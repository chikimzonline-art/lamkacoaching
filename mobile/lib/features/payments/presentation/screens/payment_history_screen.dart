import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_card.dart';
import '../../services/receipt_generator_service.dart';

class PaymentHistoryScreen extends ConsumerWidget {
  const PaymentHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Mock data for payment history
    final payments = [
      {
        'id': 'INV-2026-0801',
        'item': 'NEET Target Batch 2026',
        'amount': 25000.0,
        'date': DateTime.now().subtract(const Duration(days: 5)),
        'status': 'Successful',
      },
      {
        'id': 'INV-2026-0715',
        'item': 'Study Cabin - Monthly Pass',
        'amount': 1500.0,
        'date': DateTime.now().subtract(const Duration(days: 20)),
        'status': 'Successful',
      }
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('Payment History')),
      body: SafeArea(
        child: Padding(
          padding: AppDimensions.screenPadding,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Past Transactions',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppDimensions.space16),
              Expanded(
                child: ListView.separated(
                  itemCount: payments.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (context, index) {
                    final payment = payments[index];
                    return AppCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                payment['id'] as String,
                                style: theme.textTheme.labelMedium?.copyWith(
                                  color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.successBg,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  payment['status'] as String,
                                  style: const TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.success,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            payment['item'] as String,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            DateFormat('dd MMM yyyy, hh:mm a').format(payment['date'] as DateTime),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '₹${(payment['amount'] as double).toStringAsFixed(2)}',
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky,
                                ),
                              ),
                              OutlinedButton.icon(
                                onPressed: () {
                                  final service = ReceiptGeneratorService();
                                  service.generateAndPrintReceipt(
                                    studentName: 'John Doe', // Mocked user name
                                    invoiceId: payment['id'] as String,
                                    amount: payment['amount'] as double,
                                    itemName: payment['item'] as String,
                                    date: payment['date'] as DateTime,
                                  );
                                },
                                icon: const Icon(Icons.download_rounded, size: 18),
                                label: const Text('Receipt'),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
