import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../core/security/local_auth_service.dart';
import '../../../../core/utils/haptic_service.dart';
import '../../../../core/widgets/app_button.dart';
import '../controllers/auth_notifier.dart';

/// Modal bottom sheet prompted after a student's first successful password login,
/// inviting them to enable 1-Tap Fingerprint / Face ID login for future sessions.
class BiometricEnrollmentSheet extends ConsumerStatefulWidget {
  const BiometricEnrollmentSheet({super.key});

  static Future<void> show(BuildContext context) {
    return showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => const BiometricEnrollmentSheet(),
    );
  }

  @override
  ConsumerState<BiometricEnrollmentSheet> createState() =>
      _BiometricEnrollmentSheetState();
}

class _BiometricEnrollmentSheetState
    extends ConsumerState<BiometricEnrollmentSheet> {
  bool _isAuthenticating = false;

  Future<void> _handleEnableBiometrics() async {
    setState(() => _isAuthenticating = true);
    await HapticService.selectionClick();

    final localAuth = ref.read(localAuthServiceProvider);
    final success = await localAuth.authenticate(
      localizedReason: 'Scan fingerprint or Face ID to enable 1-Tap login',
    );

    if (!mounted) return;
    setState(() => _isAuthenticating = false);

    if (success) {
      await HapticService.heavyImpact();
      await ref
          .read(authNotifierProvider.notifier)
          .setBiometricsEnrolled(true);

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Text('1-Tap Biometric Login enabled!'),
              ],
            ),
            backgroundColor: Color(0xFF059669),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } else {
      await HapticFeedback.vibrate();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Biometric verification cancelled.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final sheetBg = isDark
        ? AppColors.darkSurfaceElevated
        : AppColors.lightSurfaceElevated;

    return Container(
      decoration: BoxDecoration(
        color: sheetBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.15),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag Handle
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark ? const Color(0xFF475569) : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // Fingerprint Hero Icon
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFF059669).withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: const Color(0xFF059669).withValues(alpha: 0.25),
                  width: 2,
                ),
              ),
              child: const Icon(
                Icons.fingerprint_rounded,
                size: 42,
                color: Color(0xFF059669),
              ),
            ),

            const SizedBox(height: 18),

            // Title & Description
            Text(
              'Enable 1-Tap Biometric Login?',
              textAlign: TextAlign.center,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w800,
                fontSize: 19,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Unlock your student portal, active study cabin, and schedule instantly using your fingerprint or Face ID next time.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                height: 1.4,
                color: isDark ? Colors.white60 : const Color(0xFF64748B),
              ),
            ),

            const SizedBox(height: 24),

            // Enable 1-Tap Action Button
            AppButton(
              text: 'Enable 1-Tap Login',
              isLoading: _isAuthenticating,
              onPressed: _handleEnableBiometrics,
            ),

            const SizedBox(height: 10),

            // Maybe Later Action Button
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  HapticService.selectionClick();
                  Navigator.of(context).pop();
                },
                style: TextButton.styleFrom(
                  foregroundColor: isDark ? Colors.white60 : const Color(0xFF64748B),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Maybe Later',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
