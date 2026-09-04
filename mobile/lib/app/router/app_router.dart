import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/controllers/auth_notifier.dart';
import '../../features/auth/presentation/controllers/auth_state.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/cabins/presentation/screens/cabins_screen.dart';
import '../../features/courses/presentation/screens/courses_screen.dart';
import '../../features/dashboard/presentation/screens/staff_dashboard_screen.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/dashboard/presentation/screens/scanner_screen.dart';
import '../../features/notifications/presentation/screens/notifications_hub_screen.dart';
import '../../features/dashboard/presentation/screens/notices_screen.dart';
import '../../features/dashboard/presentation/screens/schedule_attendance_screen.dart';
import '../../features/profile/presentation/screens/more_screen.dart';
import '../../features/profile/presentation/screens/account_settings_screen.dart';
import '../../features/payments/presentation/screens/payment_history_screen.dart';
import 'app_navigation_shell.dart';
import 'route_names.dart';

/// Global navigation key for root overlays and dialogs
final rootNavigatorKey = GlobalKey<NavigatorState>();

/// Riverpod provider for GoRouter configuration with role-based auth guards and shell navigation.
final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: false,
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminOverview,
        name: 'admin-overview',
        builder: (context, state) => const StaffDashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.qrScanner,
        name: 'qr-scanner',
        builder: (context, state) => const ScannerScreen(),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        name: 'notifications',
        builder: (context, state) => const NotificationsHubScreen(),
      ),
      GoRoute(
        path: AppRoutes.profile,
        name: 'profile',
        builder: (context, state) => const AccountSettingsScreen(),
      ),
      GoRoute(
        path: AppRoutes.paymentHistory,
        name: 'payment-history',
        builder: (context, state) => const PaymentHistoryScreen(),
      ),
      GoRoute(
        path: AppRoutes.notices,
        name: 'notices',
        builder: (context, state) => const NoticesScreen(),
      ),
      GoRoute(
        path: AppRoutes.scheduleAttendance,
        name: 'schedule-attendance',
        builder: (context, state) => const ScheduleAttendanceScreen(),
      ),

      // 4-Tab Student Shell Route
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppNavigationShell(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Dashboard / Student Home
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.dashboard,
                name: 'dashboard',
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),

          // Branch 1: Course Explorer
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.courses,
                name: 'courses',
                builder: (context, state) {
                  final tab = state.uri.queryParameters['tab'];
                  return CoursesScreen(initialTab: tab);
                },
              ),
            ],
          ),

          // Branch 2: Study Cabins
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.cabins,
                name: 'cabins',
                builder: (context, state) {
                  final tab = state.uri.queryParameters['tab'];
                  return CabinsScreen(initialTab: tab);
                },
              ),
            ],
          ),

          // Branch 3: More / Settings / Profile
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.more,
                name: 'more',
                builder: (context, state) => const MoreScreen(),
              ),
            ],
          ),
        ],
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(child: Text('Page not found: ${state.uri.toString()}')),
    ),
  );
});

/// Riverpod provider for the router notifier bridge.
final routerNotifierProvider = Provider<RouterNotifier>((ref) {
  return RouterNotifier(ref);
});

/// Bridge connecting Riverpod [AuthNotifier] state to GoRouter redirect listener.
class RouterNotifier extends ChangeNotifier {
  final Ref _ref;

  RouterNotifier(this._ref) {
    _ref.listen<AuthState>(
      authNotifierProvider,
      (_, __) => notifyListeners(),
    );
  }

  /// Dynamic redirection logic for authentication and role guards.
  String? redirect(BuildContext context, GoRouterState state) {
    final authState = _ref.read(authNotifierProvider);
    final isLoggingIn = state.matchedLocation == AppRoutes.login;

    final isSplash = state.matchedLocation == AppRoutes.splash;
    if (isSplash) {
      return null;
    }

    // While initializing or actively authenticating, do not force redirects
    if (authState is AuthInitial || authState is Authenticating) {
      return null;
    }

    // Unauthenticated: Redirect protected routes to login
    if (authState is Unauthenticated || authState is AuthFailureState) {
      return isLoggingIn ? null : AppRoutes.login;
    }

    // Authenticated: Route according to role
    if (authState is Authenticated) {
      final user = authState.user;
      final isStaffOrAdmin = user.isElevated;

      // If user is on the login screen or initial route, direct them to their role hub
      if (isLoggingIn || state.matchedLocation == AppRoutes.initial) {
        return isStaffOrAdmin ? AppRoutes.adminOverview : AppRoutes.dashboard;
      }

      // If a regular student attempts to enter admin consoles, redirect to student dashboard
      if (!isStaffOrAdmin && state.matchedLocation == AppRoutes.adminOverview) {
        return AppRoutes.dashboard;
      }
    }

    return null;
  }
}
