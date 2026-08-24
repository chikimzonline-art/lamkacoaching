import '../../../../core/errors/either.dart';
import '../../../../core/errors/failures.dart';
import 'user_entity.dart';

/// Abstract contract for authentication and session management.
abstract class AuthRepository {
  /// Authenticates using credentials (phone / email / username and password)
  /// against the NextAuth backend.
  Future<Either<Failure, UserEntity>> login({
    required String identifier,
    required String password,
  });

  /// Authenticates using local native biometrics (Fingerprint / Face ID).
  Future<Either<Failure, UserEntity>> loginWithBiometrics();

  /// Logs out the user and clears all local credentials, tokens, and cached sessions.
  Future<Either<Failure, void>> logout();

  /// Retrieves the currently cached user session from local secure storage.
  Future<Either<Failure, UserEntity?>> getCachedUser();

  /// Checks whether biometric hardware is available and enrolled on the device.
  Future<bool> isBiometricsAvailable();

  /// Checks whether 1-tap biometric unlock is enrolled by the user in app settings.
  Future<bool> isBiometricsEnrolled();

  /// Updates user preference for 1-tap biometric unlock.
  Future<void> setBiometricsEnrolled(bool enabled);
}
