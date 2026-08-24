import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_dimensions.dart';
import '../../../../app/theme/theme_provider.dart';
import '../../../../core/utils/haptic_service.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_card.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../controllers/auth_notifier.dart';
import '../controllers/auth_state.dart';

/// Production-ready, high-contrast Login Screen supporting NextAuth credentials
/// and 1-Tap Native Biometrics (Fingerprint / Face ID).
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = true;

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) {
      await HapticService.lightImpact();
      return;
    }

    await HapticService.selectionClick();
    final identifier = _identifierController.text.trim();
    final password = _passwordController.text;

    final success = await ref
        .read(authNotifierProvider.notifier)
        .login(identifier: identifier, password: password);

    if (success && mounted) {
      _checkBiometricEnrollmentPrompt();
    }
  }

  Future<void> _handleBiometricLogin() async {
    await HapticService.selectionClick();
    await ref.read(authNotifierProvider.notifier).authenticateWithBiometrics();
  }

  void _checkBiometricEnrollmentPrompt() {
    final authState = ref.read(authNotifierProvider);
    if (authState is Authenticated && authState.justLoggedIn) {
      // Prompt user to enable 1-Tap Biometric login if not yet enabled
      _showBiometricEnrollmentSheet();
    }
  }

  void _showBiometricEnrollmentSheet() {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    showModalBottomSheet(
      context: context,
      backgroundColor: isDark
          ? AppColors.darkSurfaceElevated
          : AppColors.lightSurfaceElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: 24.0,
              vertical: 20.0,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.darkBorder : AppColors.lightBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isDark
                        ? AppColors.darkAccentTeal.withValues(alpha: 0.15)
                        : AppColors.lightAccentSky.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.fingerprint_rounded,
                    size: 40,
                    color: isDark
                        ? AppColors.darkAccentTeal
                        : AppColors.lightAccentSky,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Enable 1-Tap Biometrics?',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Use your fingerprint or Face ID to quickly and securely unlock your account next time.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: isDark
                        ? AppColors.darkTextSecondary
                        : AppColors.lightTextSecondary,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: AppButton(
                        text: 'Not Now',
                        variant: AppButtonVariant.outline,
                        onPressed: () => Navigator.of(ctx).pop(),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: AppButton(
                        text: 'Enable 1-Tap',
                        onPressed: () async {
                          await ref
                              .read(authNotifierProvider.notifier)
                              .setBiometricsEnrolled(true);
                          if (ctx.mounted) {
                            Navigator.of(ctx).pop();
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final currentThemeMode = ref.watch(themeModeProvider);
    final authState = ref.watch(authNotifierProvider);

    final isLoading = authState is Authenticating;
    final errorMessage =
        authState is AuthFailureState ? authState.message : null;

    final canUseBiometrics =
        (authState is Unauthenticated && authState.canUseBiometrics) ||
        (authState is AuthFailureState && authState.canUseBiometrics);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        actions: [
          IconButton(
            tooltip: 'Toggle Theme',
            icon: Icon(
              currentThemeMode == ThemeMode.dark
                  ? Icons.light_mode_outlined
                  : Icons.dark_mode_outlined,
              color: isDark
                  ? AppColors.darkAccentTeal
                  : AppColors.lightAccentSky,
            ),
            onPressed: () {
              ref.read(themeModeProvider.notifier).toggleTheme();
            },
          ),
          const SizedBox(width: AppDimensions.space8),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: AppDimensions.screenPadding,
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // App Title / Brand Header
                  Center(
                    child: Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkSurfaceElevated
                            : AppColors.lightSurfaceElevated,
                        borderRadius: AppDimensions.borderRadiusLg,
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                      ),
                      child: Icon(
                        Icons.school_rounded,
                        size: 30,
                        color: isDark
                            ? AppColors.darkAccentTeal
                            : AppColors.lightAccentSky,
                      ),
                    ),
                  ),
                  const SizedBox(height: AppDimensions.space16),
                  Text(
                    'Lamka Coaching',
                    style: theme.textTheme.displaySmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppDimensions.space6),
                  Text(
                    'Excellence in Learning & Study Spaces',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: isDark
                          ? AppColors.darkTextSecondary
                          : AppColors.lightTextSecondary,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppDimensions.space32),

                  // Login Form Card
                  AppCard(
                    padding: const EdgeInsets.all(24.0),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'Sign In',
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              if (canUseBiometrics)
                                Tooltip(
                                  message: '1-Tap Biometric Unlock',
                                  child: Material(
                                    color: Colors.transparent,
                                    child: InkWell(
                                      borderRadius: BorderRadius.circular(20),
                                      onTap:
                                          isLoading ? null : _handleBiometricLogin,
                                      child: Container(
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? AppColors.darkAccentTeal
                                                  .withValues(alpha: 0.15)
                                              : AppColors.lightAccentSky
                                                  .withValues(alpha: 0.15),
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: isDark
                                                ? AppColors.darkAccentTeal
                                                    .withValues(alpha: 0.3)
                                                : AppColors.lightAccentSky
                                                    .withValues(alpha: 0.3),
                                          ),
                                        ),
                                        child: Icon(
                                          Icons.fingerprint_rounded,
                                          size: 24,
                                          color: isDark
                                              ? AppColors.darkAccentTeal
                                              : AppColors.lightAccentSky,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: AppDimensions.space4),
                          Text(
                            'Enter your credentials to access your account',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isDark
                                  ? AppColors.darkTextTertiary
                                  : AppColors.lightTextTertiary,
                            ),
                          ),
                          const SizedBox(height: AppDimensions.space20),

                          // High-contrast Error Banner
                          if (errorMessage != null) ...[
                            Container(
                              padding: const EdgeInsets.all(12.0),
                              decoration: BoxDecoration(
                                color: AppColors.errorBg,
                                borderRadius: AppDimensions.borderRadiusSm,
                                border: Border.all(
                                  color: AppColors.error.withValues(alpha: 0.3),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error_outline,
                                    size: 18,
                                    color: AppColors.error,
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      errorMessage,
                                      style: theme.textTheme.bodySmall
                                          ?.copyWith(color: AppColors.error),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: AppDimensions.space16),
                          ],

                          // Identifier Field (Phone / Email / Username)
                          AppTextField(
                            key: const Key('login_identifier_field'),
                            controller: _identifierController,
                            label: 'Email, Phone or Username',
                            hint: 'student@lamkacoaching.com',
                            keyboardType: TextInputType.emailAddress,
                            prefixIcon: const Icon(
                              Icons.person_outline_rounded,
                              size: 18,
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Please enter your email, phone, or username';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppDimensions.space16),

                          // Password Field
                          AppTextField(
                            key: const Key('login_password_field'),
                            controller: _passwordController,
                            label: 'Password',
                            hint: '••••••••',
                            isPassword: true,
                            textInputAction: TextInputAction.done,
                            prefixIcon: const Icon(
                              Icons.lock_outline,
                              size: 18,
                            ),
                            onSubmitted: (_) => _handleLogin(),
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please enter your password';
                              }
                              if (value.length < 4) {
                                return 'Password must be at least 4 characters';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: AppDimensions.space12),

                          // Remember Me & Forgot Password
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: _rememberMe,
                                      activeColor: isDark
                                          ? AppColors.darkAccentTeal
                                          : AppColors.lightAccentSky,
                                      onChanged: (val) {
                                        setState(() {
                                          _rememberMe = val ?? false;
                                        });
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Remember me',
                                    style: theme.textTheme.bodySmall,
                                  ),
                                ],
                              ),
                              TextButton(
                                onPressed: () {},
                                style: TextButton.styleFrom(
                                  padding: EdgeInsets.zero,
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: Text(
                                  'Forgot password?',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: isDark
                                        ? AppColors.darkAccentTeal
                                        : AppColors.lightAccentSky,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: AppDimensions.space24),

                          // Primary Sign In Button
                          AppButton(
                            key: const Key('login_submit_button'),
                            text: 'Sign In',
                            onPressed: _handleLogin,
                            isLoading: isLoading,
                            size: AppButtonSize.large,
                          ),

                          // 1-Tap Biometric Unlock Secondary Button
                          if (canUseBiometrics) ...[
                            const SizedBox(height: AppDimensions.space12),
                            AppButton(
                              text: 'Unlock with Biometrics',
                              icon: const Icon(Icons.fingerprint_rounded),
                              variant: AppButtonVariant.secondary,
                              onPressed:
                                  isLoading ? null : _handleBiometricLogin,
                              size: AppButtonSize.large,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: AppDimensions.space24),

                  // Bottom info note
                  Center(
                    child: Text(
                      'Lamka Coaching Center © 2026',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: isDark
                            ? AppColors.darkTextTertiary
                            : AppColors.lightTextTertiary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
