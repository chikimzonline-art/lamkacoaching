import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../services/receipt_generator_service.dart';
import '../controllers/payments_controller.dart';
import '../../domain/billing_entity.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../widgets/due_payment_bottom_sheet.dart';

class PaymentHistoryScreen extends ConsumerStatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  ConsumerState<PaymentHistoryScreen> createState() => _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends ConsumerState<PaymentHistoryScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final state = ref.watch(paymentsControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Fee & Payments')),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(paymentsControllerProvider.notifier).refresh(),
          child: state.when(
            data: (summary) {
              return ListView(
                padding: AppDimensions.screenPadding,
                children: [
                  if (summary.pendingDues.isNotEmpty) ...[
                    _buildPendingDuesSection(context, summary.pendingDues, theme, isDark),
                    const SizedBox(height: AppDimensions.space24),
                  ],
                  _buildPastTransactionsSection(context, summary.pastPayments, theme, isDark),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => ListView(
              children: [
                const SizedBox(height: 100),
                Center(child: Text('Error: $err', style: const TextStyle(color: AppColors.error))),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPendingDuesSection(
    BuildContext context,
    List<PendingDueEntity> dues,
    ThemeData theme,
    bool isDark,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: AppColors.error),
            const SizedBox(width: 8),
            Text(
              'Pending Dues',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
                color: AppColors.error,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Please settle these pending balances to prevent any interruption.',
          style: theme.textTheme.bodyMedium?.copyWith(
            color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
          ),
        ),
        const SizedBox(height: 16),
        ...dues.map((due) => _buildPendingDueCard(context, due, theme, isDark)),
      ],
    );
  }

  Widget _buildPendingDueCard(
    BuildContext context,
    PendingDueEntity due,
    ThemeData theme,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        backgroundColor: AppColors.error.withValues(alpha: 0.05),
      borderColor: AppColors.error.withValues(alpha: 0.3),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  due.type == 'cabin' ? Icons.meeting_room : Icons.menu_book,
                  size: 20,
                  color: AppColors.error,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      due.itemName,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      due.type == 'cabin'
                          ? '${due.bookingType?.replaceAll('_', ' ').toUpperCase()} BOOKING'
                          : due.departmentName ?? 'Course Fee',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    Formatters.formatPaiseToRupees(due.balance),
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: AppColors.error,
                    ),
                  ),
                  Text(
                    'Total: ${Formatters.formatPaiseToRupees(due.totalAmount)}',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                    ),
                  ),
                ],
              ),
              Row(
                children: [
                  if (due.paidAmount == 0) ...[
                    OutlinedButton(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Cancellation coming soon')),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        minimumSize: const Size(0, 36),
                      ),
                      child: const Text('Cancel'),
                    ),
                    const SizedBox(width: 8),
                  ],
                  FilledButton(
                    onPressed: () {
                      DuePaymentBottomSheet.show(context, due);
                    },
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.error,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      minimumSize: const Size(0, 36),
                    ),
                    child: const Text('Pay Now'),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ));
  }

  Widget _buildPastTransactionsSection(
    BuildContext context,
    List<TransactionEntity> transactions,
    ThemeData theme,
    bool isDark,
  ) {
    if (transactions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            'No past transactions found.',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
            ),
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Past Transactions',
          style: theme.textTheme.headlineSmall?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        ...transactions.map((transaction) => _buildTransactionCard(context, transaction, theme, isDark)),
      ],
    );
  }

  Widget _buildTransactionCard(
    BuildContext context,
    TransactionEntity payment,
    ThemeData theme,
    bool isDark,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: AppCard(
        padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                payment.receiptNo ?? 'TXN-${payment.id.substring(0, 8)}',
                style: theme.textTheme.labelMedium?.copyWith(
                  color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                  fontFamily: 'monospace',
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: payment.status.toLowerCase() == 'completed'
                      ? AppColors.successBg
                      : AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  payment.status.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: payment.status.toLowerCase() == 'completed'
                        ? AppColors.success
                        : AppColors.error,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            payment.itemName,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            payment.itemDetail,
            style: theme.textTheme.bodySmall?.copyWith(
              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            DateFormat('dd MMM yyyy, hh:mm a').format(payment.date.toLocal()),
            style: theme.textTheme.bodySmall?.copyWith(
              color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                Formatters.formatPaiseToRupees(payment.amount),
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky,
                ),
              ),
              if (payment.status.toLowerCase() == 'completed')
                OutlinedButton.icon(
                  onPressed: () {
                    final authState = ref.read(authNotifierProvider);
                    final studentName = authState.user?.name ?? 'Student';
                    
                    final service = ReceiptGeneratorService();
                    service.generateAndPrintReceipt(
                      studentName: studentName,
                      invoiceId: payment.receiptNo ?? payment.id,
                      amount: payment.amount,
                      itemName: payment.itemName,
                      date: payment.date.toLocal(),
                    );
                  },
                  icon: const Icon(Icons.download_rounded, size: 18),
                  label: const Text('Receipt'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    minimumSize: const Size(0, 36),
                  ),
                ),
            ],
          ),
        ],
      ),
    ));
  }
}
