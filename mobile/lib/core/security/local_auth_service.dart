import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';

/// Riverpod provider for the global [LocalAuthService].
final localAuthServiceProvider = Provider<LocalAuthService>((ref) {
  return LocalAuthService(LocalAuthentication());
});

/// Production-ready wrapper around native device biometrics (Fingerprint / Face ID).
class LocalAuthService {
  final LocalAuthentication _localAuth;

  LocalAuthService(this._localAuth);

  /// Checks whether the hardware supports biometric checks or device credentials.
  Future<bool> isBiometricsAvailable() async {
    try {
      final bool canCheck = await _localAuth.canCheckBiometrics;
      final bool isSupported = await _localAuth.isDeviceSupported();
      return canCheck || isSupported;
    } on PlatformException catch (_) {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Lists the biometric modalities supported on the current device (fingerprint, face, etc.).
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } on PlatformException catch (_) {
      return const [];
    } catch (_) {
      return const [];
    }
  }

  /// Prompts the user with native OS biometrics / Face ID dialog.
  /// Returns `true` if authentication succeeded, `false` otherwise.
  Future<bool> authenticate({
    String localizedReason = 'Authenticate to access Lamka Coaching Center',
    bool biometricOnly = false,
  }) async {
    try {
      final isAvailable = await isBiometricsAvailable();
      if (!isAvailable) return false;

      return await _localAuth.authenticate(
        localizedReason: localizedReason,
        options: AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: biometricOnly,
          useErrorDialogs: true,
        ),
      );
    } on PlatformException catch (_) {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Cancels any ongoing biometric authentication prompt.
  Future<bool> stopAuthentication() async {
    try {
      return await _localAuth.stopAuthentication();
    } catch (_) {
      return false;
    }
  }
}
