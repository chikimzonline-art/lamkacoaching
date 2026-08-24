import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/cabins/presentation/screens/cabin_hub_stub.dart';
import '../../features/courses/presentation/screens/courses_hub_stub.dart';
import '../../features/dashboard/presentation/screens/dashboard_screen.dart';
import '../../features/notifications/presentation/screens/notifications_hub_stub.dart';
import 'route_names.dart';

/// Global navigation key for root overlays and dialogs
final rootNavigatorKey = GlobalKey<NavigatorState>();

/// Riverpod provider for GoRouter configuration.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: AppRoutes.login,
    debugLogDiagnostics: false,
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
