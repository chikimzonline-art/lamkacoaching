import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/route_names.dart';
import '../../../../app/theme/app_colors.dart';
import '../controllers/auth_notifier.dart';
import '../controllers/auth_state.dart';

/// Animated branded splash screen displaying the official Lamka Coaching logo
/// while checking user session and routing accordingly.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  Timer? _navigationTimer;

  @override
  void initState() {
    super.initState();

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );

    _scaleAnimation = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeOutCubic,
      ),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: Curves.easeIn,
      ),
    );

    _animController.forward();

    // Give animation smooth display time, then route based on auth session
    _navigationTimer = Timer(const Duration(milliseconds: 1400), () {
      _checkSessionAndNavigate();
    });
  }

  void _checkSessionAndNavigate() {
    if (!mounted) return;

    final authState = ref.read(authNotifierProvider);

    if (authState is Authenticated) {
      final user = authState.user;
      final target = user.isElevated ? AppRoutes.adminOverview : AppRoutes.dashboard;
      context.go(target);
    } else if (authState is Unauthenticated || authState is AuthFailureState) {
      context.go(AppRoutes.login);
    } else {
      // Still initializing, wait for next tick
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) _checkSessionAndNavigate();
      });
    }
  }

  @override
  void dispose() {
    _navigationTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bgColor = isDark ? const Color(0xFF0B1120) : const Color(0xFFF8FAFC);
    final brandAccent =
        isDark ? AppColors.darkAccentTeal : const Color(0xFF059669);

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          // Background ambient radial glow
          Center(
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    brandAccent.withValues(alpha: isDark ? 0.12 : 0.08),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Main Center Content
          Center(
            child: AnimatedBuilder(
              animation: _animController,
              builder: (context, child) {
                return Opacity(
                  opacity: _fadeAnimation.value,
                  child: Transform.scale(
                    scale: _scaleAnimation.value,
                    child: child,
                  ),
                );
              },
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Official Logo Image
                  Container(
                    width: 96,
                    height: 96,
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : Colors.white,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: brandAccent.withValues(alpha: 0.25),
                          blurRadius: 24,
                          spreadRadius: 2,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => Icon(
                        Icons.school_rounded,
                        size: 48,
                        color: brandAccent,
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Brand Title
                  Text(
                    'LAMKA COACHING',
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2.0,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),

                  const SizedBox(height: 4),

                  // Tagline
                  Text(
                    'EXCELLENCE IN LEARNING & STUDY CABINS',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.4,
                      color: brandAccent,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Bottom Loading & Version
          Positioned(
            bottom: 36,
            left: 0,
            right: 0,
            child: Column(
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.2,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      brandAccent.withValues(alpha: 0.8),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  'Version 1.0.0',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
