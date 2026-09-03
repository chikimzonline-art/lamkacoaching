import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../auth/presentation/controllers/auth_notifier.dart';
import '../../../auth/presentation/controllers/auth_state.dart';
import '../../../dashboard/presentation/controllers/student_dashboard_controller.dart';
import '../../../payments/data/payments_repository.dart';
import '../../../payments/services/razorpay_service.dart';
import '../../data/courses_repository_impl.dart';
import '../../domain/course_entity.dart';

/// Modal bottom sheet allowing the student to choose Full Payment vs Custom Installment
/// for enrolling in a selected course and batch, then launching Razorpay.
class CourseEnrollmentCheckoutSheet extends ConsumerStatefulWidget {
  final CourseEntity course;
  final BatchEntity batch;

  const CourseEnrollmentCheckoutSheet({
    super.key,
    required this.course,
    required this.batch,
  });

  static Future<bool?> show(
    BuildContext context, {
    required CourseEntity course,
    required BatchEntity batch,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CourseEnrollmentCheckoutSheet(
        course: course,
        batch: batch,
      ),
    );
  }

  @override
  ConsumerState<CourseEnrollmentCheckoutSheet> createState() =>
      _CourseEnrollmentCheckoutSheetState();
}

class _CourseEnrollmentCheckoutSheetState
    extends ConsumerState<CourseEnrollmentCheckoutSheet> {
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

    String? createdEnrollmentId;

    try {
      final authState = ref.read(authNotifierProvider);
      final user = (authState is Authenticated) ? authState.user : null;

      final totalFeePaise = widget.course.totalFee;
      int finalAmountPaise = totalFeePaise;

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

        if (enteredPaise > totalFeePaise) {
          setState(() {
            _error =
                'Amount cannot exceed total course fee (${Formatters.formatPaiseToRupees(totalFeePaise)})';
            _isLoading = false;
          });
          return;
        }

        finalAmountPaise = enteredPaise;
      }

      final coursesRepo = ref.read(coursesRepositoryProvider);
      final paymentsRepo = ref.read(paymentsRepositoryProvider);
      final razorpay = ref.read(razorpayServiceProvider);

      // 1. Create draft enrollment on backend (status: 'pending_payment')
      createdEnrollmentId = await coursesRepo.createEnrollmentDraft(
        courseId: widget.course.id,
        batchId: widget.batch.id,
      );

      // 2. Create Razorpay order
      final order = await paymentsRepo.createOrder(
        amountInPaise: finalAmountPaise,
        type: 'course',
        itemId: widget.course.id,
        studentId: user?.id,
      );

      // 3. Launch Native Razorpay Checkout
      final result = await razorpay.openCheckout(
        orderId: order.orderId,
        amountInPaise: order.amount,
        name: 'Lamka Coaching Center',
        description: 'Admission for ${widget.course.name} (${widget.batch.batchName})',
        notes: {
          'studentId': user?.id ?? '',
          'type': 'course',
          'itemId': widget.course.id,
          'batchId': widget.batch.id,
          'enrollmentId': createdEnrollmentId,
        },
        customerName: user?.name ?? 'Student',
        customerPhone: user?.phone ?? '',
        customerEmail: user?.email,
        keyId: order.keyId,
      );

      // 4. Payment Succeeded!
      if (mounted) {
        final messenger = ScaffoldMessenger.of(context);
        Navigator.of(context).pop(true);
        await ref
            .read(studentDashboardControllerProvider.notifier)
            .loadDashboard(forceRefresh: true);

        messenger.showSnackBar(
          SnackBar(
            content: Text(
              'Enrolled in ${widget.course.name} successfully! Ref ID: ${result.paymentId}',
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      debugPrint('[CourseEnrollment] Checkout cancelled or failed: $e');
      // Clean up draft enrollment so student is not stuck in pending state
      if (createdEnrollmentId != null) {
        await ref
            .read(coursesRepositoryProvider)
            .cancelEnrollmentDraft(createdEnrollmentId);
      }

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
    final accentColor =
        isDark ? AppColors.darkAccentTeal : AppColors.lightAccentSky;

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
            // Handle bar
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
                  child: Icon(Icons.school_rounded, color: accentColor, size: 24),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Course Enrollment',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        '${widget.course.name} • ${widget.batch.batchName}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : AppColors.lightTextSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Fee Summary Card
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
                        'Total Course Fee',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : const Color(0xFF0369A1),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        Formatters.formatPaiseToRupees(widget.course.totalFee),
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : const Color(0xFF0284C7),
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Batch Schedule',
                        style: TextStyle(
                          fontSize: 11,
                          color: isDark
                              ? AppColors.darkTextTertiary
                              : const Color(0xFF0284C7),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.batch.timing,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: isDark
                              ? AppColors.darkTextSecondary
                              : const Color(0xFF0369A1),
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
              'Select Payment Option',
              style:
                  theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),

            // Option 1: Pay Full Amount
            InkWell(
              onTap: () => setState(() => _isFullPayment = true),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: _isFullPayment
                      ? accentColor.withValues(alpha: 0.08)
                      : (isDark
                          ? AppColors.darkSurfaceElevated
                          : Colors.transparent),
                  border: Border.all(
                    color: _isFullPayment
                        ? accentColor
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
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
                          color: _isFullPayment
                              ? accentColor
                              : (isDark
                                  ? AppColors.darkTextTertiary
                                  : AppColors.lightTextTertiary),
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
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          Text(
                            'One-time full payment (${Formatters.formatPaiseToRupees(widget.course.totalFee)})',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.darkTextSecondary
                                  : AppColors.lightTextSecondary,
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

            // Option 2: Pay Custom Installment
            InkWell(
              onTap: () => setState(() => _isFullPayment = false),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: !_isFullPayment
                      ? accentColor.withValues(alpha: 0.08)
                      : (isDark
                          ? AppColors.darkSurfaceElevated
                          : Colors.transparent),
                  border: Border.all(
                    color: !_isFullPayment
                        ? accentColor
                        : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
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
                              color: !_isFullPayment
                                  ? accentColor
                                  : (isDark
                                      ? AppColors.darkTextTertiary
                                      : AppColors.lightTextTertiary),
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
                                style: TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                'Pay partial amount now and remaining balance later',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
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
                            labelText: 'Installment Amount (₹)',
                            hintText: 'e.g. 5000',
                            helperText: 'Minimum installment is ₹500',
                            prefixText: '₹ ',
                            contentPadding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
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
                    const Icon(Icons.error_outline,
                        color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style:
                            const TextStyle(color: AppColors.error, fontSize: 12),
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
