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

    await ref
        .read(authNotifierProvider.notifier)
        .login(identifier: identifier, password: password);
  }

  Future<void> _handleBiometricLogin() async {
    await HapticService.selectionClick();
    await ref.read(authNotifierProvider.notifier).authenticateWithBiometrics();
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
                      width: 68,
                      height: 68,
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.darkSurfaceElevated
                            : AppColors.lightSurfaceElevated,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark
                              ? AppColors.darkBorder
                              : AppColors.lightBorder,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(10),
                      child: Image.asset(
                        'assets/images/logo.png',
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => Icon(
                          Icons.school_rounded,
                          size: 32,
                          color: isDark
                              ? AppColors.darkAccentTeal
                              : AppColors.lightAccentSky,
                        ),
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
                          Text(
                            'Sign In',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
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

                          // Prominent 1-Tap Biometric Quick Login Card
                          if (canUseBiometrics) ...[
                            Container(
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: isDark
                                      ? [const Color(0xFF064E3B), const Color(0xFF047857)]
                                      : [const Color(0xFF059669), const Color(0xFF10B981)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFF059669).withValues(alpha: 0.3),
                                    blurRadius: 10,
                                    offset: const Offset(0, 3),
                                  ),
                                ],
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: isLoading ? null : _handleBiometricLogin,
                                  borderRadius: BorderRadius.circular(14),
                                  child: const Padding(
                                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    child: Row(
                                      children: [
                                        Icon(Icons.fingerprint_rounded, color: Colors.white, size: 28),
                                        SizedBox(width: 14),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                '1-Tap Biometric Unlock',
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.w800,
                                                  fontSize: 14,
                                                ),
                                              ),
                                              SizedBox(height: 2),
                                              Text(
                                                'Touch sensor to sign in instantly',
                                                style: TextStyle(
                                                  color: Colors.white70,
                                                  fontSize: 11,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Icon(Icons.chevron_right_rounded, color: Colors.white70),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 18),
                            Row(
                              children: [
                                Expanded(child: Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 10),
                                  child: Text(
                                    'OR SIGN IN WITH PASSWORD',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? AppColors.darkTextTertiary : AppColors.lightTextTertiary,
                                      letterSpacing: 1.0,
                                    ),
                                  ),
                                ),
                                Expanded(child: Divider(color: isDark ? AppColors.darkBorder : AppColors.lightBorder)),
                              ],
                            ),
                            const SizedBox(height: 18),
                          ],

                          // Identifier Field (Phone / Email / Username)
                          AppTextField(
                            key: const Key('login_identifier_field'),
                            controller: _identifierController,
                            label: 'Email, Phone or Username',
                            hint: 'student@lamkacoaching.in',
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
