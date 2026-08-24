import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/controllers/auth_notifier.dart';
import '../../features/auth/presentation/controllers/auth_state.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/cabins/presentation/screens/cabin_hub_stub.dart';
import '../../features/courses/presentation/screens/courses_hub_stub.dart';
import '../../features/dashboard/presentation/screens/admin_overview_stub.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/notifications/presentation/screens/notifications_hub_stub.dart';
import 'route_names.dart';

/// Global navigation key for root overlays and dialogs
final rootNavigatorKey = GlobalKey<NavigatorState>();

/// Riverpod provider for GoRouter configuration with role-based auth guards.
final appRouterProvider = Provider<GoRouter>((ref) {
  final notifier = ref.watch(routerNotifierProvider);

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.login,
    debugLogDiagnostics: false,
    refreshListenable: notifier,
    redirect: notifier.redirect,
    routes: [
      GoRoute(
        path: AppRoutes.login,
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.dashboard,
        name: 'dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: AppRoutes.adminOverview,
        name: 'admin-overview',
        builder: (context, state) => const AdminOverviewStub(),
      ),
      GoRoute(
        path: AppRoutes.cabins,
        name: 'cabins',
        builder: (context, state) => const CabinHubStub(),
      ),
      GoRoute(
        path: AppRoutes.courses,
        name: 'courses',
        builder: (context, state) => const CoursesHubStub(),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        name: 'notifications',
        builder: (context, state) => const NotificationsHubStub(),
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
