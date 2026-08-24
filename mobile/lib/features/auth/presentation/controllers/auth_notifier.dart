import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/auth_repository.dart';
import '../../data/auth_repository_impl.dart';
import 'auth_state.dart';

/// Riverpod provider for the global [AuthNotifier].
final authNotifierProvider =
    StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final repository = ref.watch(authRepositoryProvider);
  return AuthNotifier(repository);
});

/// Riverpod StateNotifier controlling authentication, session state, and biometrics.
class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _authRepository;

  AuthNotifier(this._authRepository) : super(const AuthInitial()) {
    checkAuthStatus();
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
        state = Authenticated(cachedUser);
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

    return result.fold(
      (failure) async {
        final isBioAvailable = await _authRepository.isBiometricsAvailable();
        final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

        state = AuthFailureState(
          message: failure.message,
          biometricsAvailable: isBioAvailable,
          biometricsEnrolled: isBioEnrolled,
        );
        return false;
      },
      (user) {
        state = Authenticated(user, justLoggedIn: true);
        return true;
      },
    );
  }

  /// Authenticates using native device biometrics (Fingerprint / Face ID).
  Future<bool> authenticateWithBiometrics() async {
    state = const Authenticating(statusMessage: 'Scanning biometrics...');

    final result = await _authRepository.loginWithBiometrics();

    return result.fold(
      (failure) async {
        final isBioAvailable = await _authRepository.isBiometricsAvailable();
        final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

        state = AuthFailureState(
          message: failure.message,
          biometricsAvailable: isBioAvailable,
          biometricsEnrolled: isBioEnrolled,
        );
        return false;
      },
      (user) {
        state = Authenticated(user);
        return true;
      },
    );
  }

  /// Updates user preference for 1-tap biometric unlock.
  Future<void> setBiometricsEnrolled(bool enabled) async {
    await _authRepository.setBiometricsEnrolled(enabled);
    final isBioAvailable = await _authRepository.isBiometricsAvailable();

    if (state is Unauthenticated) {
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
    await _authRepository.logout();

    final isBioAvailable = await _authRepository.isBiometricsAvailable();
    final isBioEnrolled = await _authRepository.isBiometricsEnrolled();

    state = Unauthenticated(
      biometricsAvailable: isBioAvailable,
      biometricsEnrolled: isBioEnrolled,
    );
  }
}
