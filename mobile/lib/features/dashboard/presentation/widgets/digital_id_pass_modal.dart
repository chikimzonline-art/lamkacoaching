import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../auth/domain/user_entity.dart';
import '../../domain/student_dashboard_entity.dart';

/// Interactive high-security digital ID card modal with dynamic QR generation.
class DigitalIdPassModal extends StatefulWidget {
  final UserEntity user;
  final List<EnrollmentEntity> enrollments;

  const DigitalIdPassModal({
    super.key,
    required this.user,
    this.enrollments = const [],
  });

  /// Static helper to display the modal bottom sheet.
  static Future<void> show(
    BuildContext context, {
    required UserEntity user,
    List<EnrollmentEntity> enrollments = const [],
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DigitalIdPassModal(
        user: user,
        enrollments: enrollments,
      ),
    );
  }

  @override
  State<DigitalIdPassModal> createState() => _DigitalIdPassModalState();
}

class _DigitalIdPassModalState extends State<DigitalIdPassModal>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final primaryEnrollment = widget.enrollments.isNotEmpty
        ? widget.enrollments.first
        : null;

    final studentRoll = primaryEnrollment?.rollNumber ??
        'LCC-${widget.user.id.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '').padRight(6, '0').substring(0, 6).toUpperCase()}';

    final courseName = primaryEnrollment?.courseName ?? 'Enrolled Student';
    final batchName = primaryEnrollment?.batchName ?? 'General Batch';

    final qrPayload =
        'LAMKA:STUDENT:${widget.user.id}:${DateTime.now().millisecondsSinceEpoch}:${widget.user.phone ?? "NA"}';

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppDimensions.radiusLg),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Drag Handle Bar
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),

              // ID Pass Container Card
              AppCard(
                hasGlow: true,
                padding: const EdgeInsets.all(20),
                borderColor: isDark
                    ? AppColors.darkAccentTeal.withValues(alpha: 0.4)
                    : AppColors.lightAccentSky.withValues(alpha: 0.4),
                child: Column(
                  children: [
                    // Header Ribbon
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: (isDark
                                        ? AppColors.darkAccentTeal
                                        : AppColors.lightAccentSky)
                                    .withValues(alpha: 0.15),
                                borderRadius: AppDimensions.borderRadiusSm,
                              ),
                              child: Image.asset(
                                'assets/images/logo.png',
                                width: 20,
                                height: 20,
                                fit: BoxFit.contain,
                                errorBuilder: (_, __, ___) => Icon(
                                  Icons.school_rounded,
                                  size: 18,
                                  color: isDark
                                      ? AppColors.darkAccentTeal
                                      : AppColors.lightAccentSky,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'LAMKA COACHING CENTER',
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.1,
                                    color: isDark
                                        ? AppColors.darkAccentTeal
                                        : AppColors.lightAccentSky,
                                  ),
                                ),
                                Text(
                                  'Official Student Digital Pass',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    fontSize: 11,
                                    color: isDark
                                        ? AppColors.darkTextTertiary
                                        : AppColors.lightTextTertiary,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        // Security Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.successBg,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: AppColors.success.withValues(alpha: 0.4),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              AnimatedBuilder(
                                animation: _pulseAnimation,
                                builder: (context, child) {
                                  return Container(
                                    width: 6,
                                    height: 6,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: AppColors.success.withValues(
                                        alpha: _pulseAnimation.value,
                                      ),
                                    ),
                                  );
                                },
                              ),
                              const SizedBox(width: 5),
                              Text(
                                'ACTIVE',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: AppColors.success,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 10,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const Divider(height: 24, thickness: 1),

                    // Student Profile Info
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: isDark
                              ? AppColors.darkAccentTeal.withValues(alpha: 0.2)
                              : AppColors.lightAccentSky.withValues(alpha: 0.15),
                          child: Text(
                            widget.user.name.isNotEmpty
                                ? widget.user.name[0].toUpperCase()
                                : 'S',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w700,
                              color: isDark
                                  ? AppColors.darkAccentTeal
                                  : AppColors.lightAccentSky,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                widget.user.name,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Roll No: $studentRoll',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: isDark
                                      ? AppColors.darkTextSecondary
                                      : AppColors.lightTextSecondary,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '$courseName ($batchName)',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: isDark
                                      ? AppColors.darkAccentTeal
                                      : AppColors.lightAccentSky,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 18),

                    // Scannable Dynamic QR Code
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: AppDimensions.borderRadiusMd,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 8,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: QrImageView(
                        data: qrPayload,
                        version: QrVersions.auto,
                        size: 170.0,
                        backgroundColor: Colors.white,
                        eyeStyle: const QrEyeStyle(
                          eyeShape: QrEyeShape.square,
                          color: Color(0xFF0F172A),
                        ),
                        dataModuleStyle: const QrDataModuleStyle(
                          dataModuleShape: QrDataModuleShape.square,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),

                    const SizedBox(height: 12),

                    Text(
                      'Scan at Center Entrance or Study Cabin Kiosk',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontSize: 11,
                        color: isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Done / Close Action
              AppButton(
                text: 'Done',
                variant: AppButtonVariant.secondary,
                onPressed: () => Navigator.of(context).pop(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
