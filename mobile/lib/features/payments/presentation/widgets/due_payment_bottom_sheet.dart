import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../../auth/presentation/controllers/auth_state.dart';
import '../../data/payments_repository.dart';
import '../../domain/billing_entity.dart';
import '../../services/razorpay_service.dart';
import '../controllers/payments_controller.dart';

class DuePaymentBottomSheet extends ConsumerStatefulWidget {
  final PendingDueEntity due;

  const DuePaymentBottomSheet({
    super.key,
    required this.due,
  });

  static Future<void> show(BuildContext context, PendingDueEntity due) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DuePaymentBottomSheet(due: due),
    );
  }

  @override
  ConsumerState<DuePaymentBottomSheet> createState() => _DuePaymentBottomSheetState();
}

class _DuePaymentBottomSheetState extends ConsumerState<DuePaymentBottomSheet> {
  bool _isFullPayment = true;
  final TextEditingController _amountController = TextEditingController();
  bool _isLoading = false;
  String? _error;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  Future<void> _handlePayment() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authState = ref.read(authNotifierProvider);
      final user = (authState is Authenticated) ? authState.user : null;

      final balancePaise = widget.due.balance.toInt();
      int finalAmountPaise = balancePaise;

      if (!_isFullPayment) {
        final enteredRupees = int.tryParse(_amountController.text.trim());
        if (enteredRupees == null || enteredRupees <= 0) {
          setState(() {
            _error = 'Please enter a valid amount in rupees';
            _isLoading = false;
          });
          return;
        }

        final enteredPaise = enteredRupees * 100;
        if (enteredPaise < 50000) {
          setState(() {
            _error = 'Minimum payment is ₹500';
            _isLoading = false;
          });
          return;
        }

        if (enteredPaise > balancePaise) {
          setState(() {
            _error = 'Amount cannot exceed the pending balance (${Formatters.formatPaiseToRupees(balancePaise.toDouble())})';
            _isLoading = false;
          });
          return;
        }

        finalAmountPaise = enteredPaise;
      }

      final repo = ref.read(paymentsRepositoryProvider);
      final razorpay = ref.read(razorpayServiceProvider);

      final orderType = widget.due.type == 'enrollment' ? 'course' : 'cabin';

      // 1. Create Razorpay Order
      final order = await repo.createOrder(
        amountInPaise: finalAmountPaise,
        type: orderType,
        itemId: widget.due.itemId,
        studentId: user?.id,
        bookingId: widget.due.type == 'booking' ? widget.due.id : null,
      );

      // 2. Open Native Razorpay Checkout
      final result = await razorpay.openCheckout(
        orderId: order.orderId,
        amountInPaise: order.amount,
        name: 'Lamka Coaching Center',
        description: 'Payment for ${widget.due.itemName}',
        notes: {
          'studentId': user?.id ?? '',
          'type': orderType,
          'itemId': widget.due.itemId,
          if (widget.due.type == 'booking') 'bookingId': widget.due.id,
        },
        customerName: user?.name ?? 'Student',
        customerPhone: user?.phone ?? '',
        customerEmail: user?.email,
        keyId: order.keyId,
      );

      // 3. Payment succeeded! Refresh billing summary & notify
      if (mounted) {
        Navigator.of(context).pop();
        await ref.read(paymentsControllerProvider.notifier).refresh();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Payment of ${Formatters.formatPaiseToRupees(finalAmountPaise.toDouble())} successful! Ref ID: ${result.paymentId}'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('[DuePayment] Error: $e');
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final due = widget.due;
    final accentColor = isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Drag handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: isDark ? Colors.grey[700] : Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header Title
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: accentColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    due.type == 'cabin' ? Icons.meeting_room : Icons.menu_book,
                    color: accentColor,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Complete Due Payment',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        due.itemName,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Due Summary Box
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark
                    ? AppColors.darkSurfaceElevated
                    : const Color(0xFFF0F9FF),
                border: Border.all(
                  color: isDark ? AppColors.darkBorder : const Color(0xFFBAE6FD),
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Pending Dues',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark ? AppColors.darkTextSecondary : const Color(0xFF0369A1),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        Formatters.formatPaiseToRupees(due.balance),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF0284C7),
                        ),
                      ),
                    ],
                  ),
                  if (due.paidAmount > 0)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Paid So Far',
                          style: TextStyle(
                            fontSize: 11,
                            color: isDark ? AppColors.darkTextTertiary : const Color(0xFF0284C7),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          Formatters.formatPaiseToRupees(due.paidAmount),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: isDark ? AppColors.darkTextSecondary : const Color(0xFF0369A1),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Payment Option Selection
            Text(
              'How would you like to pay?',
              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),

            // Full Amount Option
            InkWell(
              onTap: () => setState(() => _isFullPayment = true),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _isFullPayment
                      ? accentColor.withValues(alpha: 0.08)
                      : (isDark ? AppColors.darkSurfaceElevated : Colors.transparent),
                  border: Border.all(
                    color: _isFullPayment ? accentColor : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    width: _isFullPayment ? 1.5 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: _isFullPayment ? accentColor : (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary),
                          width: _isFullPayment ? 6 : 2,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Pay Full Amount',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          Text(
                            'Clear all pending dues (${Formatters.formatPaiseToRupees(due.balance)})',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 10),

            // Custom Installment Option (Courses only or partial allowed)
            InkWell(
              onTap: () => setState(() => _isFullPayment = false),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: !_isFullPayment
                      ? accentColor.withValues(alpha: 0.08)
                      : (isDark ? AppColors.darkSurfaceElevated : Colors.transparent),
                  border: Border.all(
                    color: !_isFullPayment ? accentColor : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                    width: !_isFullPayment ? 1.5 : 1,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: !_isFullPayment ? accentColor : (isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary),
                              width: !_isFullPayment ? 6 : 2,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Pay Custom Installment',
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                'Pay a portion now and clear the rest later',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.darkTextSecondary : AppColors.lightTextSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (!_isFullPayment) ...[
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.only(left: 32, right: 8),
                        child: TextField(
                          controller: _amountController,
                          keyboardType: TextInputType.number,
                          autofocus: true,
                          decoration: InputDecoration(
                            labelText: 'Amount to Pay (₹)',
                            hintText: 'e.g. 2000',
                            helperText: 'Minimum payment is ₹500',
                            prefixText: '₹ ',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),

            if (_error != null) ...[
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: const TextStyle(color: AppColors.error, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // Pay Button
            AppButton(
              text: _isLoading ? 'Launching Razorpay...' : 'Proceed to Pay',
              isLoading: _isLoading,
              icon: const Icon(Icons.lock_outline, size: 18),
              onPressed: _isLoading ? null : _handlePayment,
            ),
          ],
        ),
      ),
    );
  }
}
