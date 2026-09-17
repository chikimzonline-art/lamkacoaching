import 'dart:async';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/network/dio_client.dart';
import '../../../notifications/application/notification_service.dart';
import '../../domain/auth_repository.dart';
import '../../domain/user_entity.dart';
import '../../data/auth_repository_impl.dart';
import 'auth_state.dart';

/// Riverpod provider for the global [AuthNotifier].
final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  final notificationService = ref.watch(notificationServiceProvider);
  final dioClient = ref.watch(dioClientProvider);
  return AuthNotifier(
    repository,
    notificationService: notificationService,
    dioClient: dioClient,
  );
});

/// Riverpod StateNotifier controlling authentication, session state, and biometrics.
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;
  final NotificationService? notificationService;
  final DioClient? dioClient;

  AuthNotifier(
    this._authRepository, {
    this.notificationService,
    this.dioClient,
  }) : super(const AuthInitial()) {
    checkAuthStatus();
  }

  void _syncUserContext(String userId) {
    if (notificationService != null && dioClient != null) {
      notificationService!.registerDeviceToken(dioClient!);
    }
    try {
      unawaited(FirebaseCrashlytics.instance.setUserIdentifier(userId));
    } catch (_) {}
  }

  /// Checks local secure storage and cached session upon app launch.
  Future<void> checkAuthStatus() async {
    try {
      final isBioAvailable = await _authRepository.isBiometricsAvailable();
      final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

      final cachedResult = await _authRepository.getCachedUser();
      final cachedUser = cachedResult.rightOrNull;

      if (cachedUser != null) {
        // Active session exists; restore authenticated state
        state = Authenticated(
          cachedUser,
          biometricsAvailable: isBioAvailable,
          biometricsEnrolled: isBioEnrolled,
        );
        _syncUserContext(cachedUser.id);
        return;
      }

      state = Unauthenticated(
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: isBioEnrolled,
      );
    } catch (_) {
      state = const Unauthenticated();
    }
  }

  /// Authenticates credentials with NextAuth backend.
  Future<bool> login({
    required String identifier,
    required String password,
  }) async {
    state = const Authenticating(statusMessage: 'Signing in...');

    final result = await _authRepository.login(
      identifier: identifier,
      password: password,
    );

    final isBioAvailable = await _authRepository.isBiometricsAvailable();
    final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

    if (result.isLeft) {
      final failure = result.leftOrNull!;

      state = AuthFailureState(
        message: failure.message,
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: isBioEnrolled,
      );
      return false;
    }

    final user = result.rightOrNull!;
    state = Authenticated(
      user,
      justLoggedIn: true,
      biometricsAvailable: isBioAvailable,
      biometricsEnrolled: isBioEnrolled,
    );
    _syncUserContext(user.id);
    return true;
  }

  /// Resets the `justLoggedIn` flag once the first-login prompt has been handled.
  void consumeJustLoggedIn() {
    if (state is Authenticated) {
      final current = state as Authenticated;
      if (current.justLoggedIn) {
        state = Authenticated(
          current.user,
          justLoggedIn: false,
          biometricsAvailable: current.biometricsAvailable,
          biometricsEnrolled: current.biometricsEnrolled,
        );
      }
    }
  }

  /// Authenticates using native device biometrics (Fingerprint / Face ID).
  Future<bool> authenticateWithBiometrics() async {
    state = const Authenticating(statusMessage: 'Scanning biometrics...');

    final result = await _authRepository.loginWithBiometrics();
    final isBioAvailable = await _authRepository.isBiometricsAvailable();
    final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

    if (result.isLeft) {
      final failure = result.leftOrNull!;

      state = AuthFailureState(
        message: failure.message,
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: isBioEnrolled,
      );
      return false;
    }

    final user = result.rightOrNull!;
    state = Authenticated(
      user,
      biometricsAvailable: isBioAvailable,
      biometricsEnrolled: isBioEnrolled,
    );
    _syncUserContext(user.id);
    return true;
  }

  /// Updates user preference for 1-tap biometric unlock.
  Future<void> setBiometricsEnrolled(bool enabled) async {
    await _authRepository.setBiometricsEnrolled(enabled);
    final isBioAvailable = await _authRepository.isBiometricsAvailable();

    if (state is Authenticated) {
      final current = state as Authenticated;
      state = Authenticated(
        current.user,
        justLoggedIn: current.justLoggedIn,
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: enabled,
      );
    } else if (state is Unauthenticated) {
      final current = state as Unauthenticated;
      state = Unauthenticated(
        message: current.message,
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: enabled,
      );
    } else if (state is AuthFailureState) {
      final current = state as AuthFailureState;
      state = AuthFailureState(
        message: current.message,
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: enabled,
      );
    }
  }

  /// Logs out of the current session and clears all stored tokens.
  Future<void> logout() async {
    state = const Authenticating(statusMessage: 'Signing out...');
    try {
      await FirebaseCrashlytics.instance.setUserIdentifier('');
    } catch (_) {}
    await _authRepository.logout();

    final isBioAvailable = await _authRepository.isBiometricsAvailable();
    final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

    state = Unauthenticated(
      biometricsAvailable: isBioAvailable,
      biometricsEnrolled: isBioEnrolled,
    );
  }

  /// Permanently deletes the student account and all personal data.
  Future<Either<Failure, void>> deleteAccount(String password) async {
    final result = await _authRepository.deleteAccount(password: password);
    final isBioAvailable = await _authRepository.isBiometricsAvailable();

    if (result.isRight) {
      try {
        await FirebaseCrashlytics.instance.setUserIdentifier('');
      } catch (_) {}
      state = Unauthenticated(
        message: 'Your account has been permanently deleted.',
        biometricsAvailable: isBioAvailable,
        biometricsEnrolled: false,
      );
    }
    return result;
  }

  /// Updates student profile details and refreshes active session state.
  Future<Either<Failure, UserEntity>> updateProfile({
    String? phone,
    String? email,
    String? address,
  }) async {
    final result = await _authRepository.updateProfile(
      phone: phone,
      email: email,
      address: address,
    );

    if (result.isRight) {
      final updatedUser = result.rightOrNull!;
      if (state is Authenticated) {
        final current = state as Authenticated;
        state = Authenticated(
          updatedUser,
          justLoggedIn: current.justLoggedIn,
          biometricsAvailable: current.biometricsAvailable,
          biometricsEnrolled: current.biometricsEnrolled,
        );
      }
    }
    return result;
  }

  /// Changes the student password.
  Future<Either<Failure, void>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    return await _authRepository.changePassword(
      currentPassword: currentPassword,
      newPassword: newPassword,
    );
  }
}
