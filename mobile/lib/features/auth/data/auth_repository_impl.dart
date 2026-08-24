import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/errors/either.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/security/local_auth_service.dart';
import '../../../../core/security/secure_storage_service.dart';
import '../domain/auth_repository.dart';
import '../domain/user_entity.dart';
import 'auth_remote_data_source.dart';
import 'user_model.dart';

/// Riverpod provider for the [AuthRepository] implementation.
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final remoteDataSource = ref.watch(authRemoteDataSourceProvider);
  final storageService = ref.watch(secureStorageServiceProvider);
  final localAuthService = ref.watch(localAuthServiceProvider);

  return AuthRepositoryImpl(
    remoteDataSource: remoteDataSource,
    storageService: storageService,
    localAuthService: localAuthService,
  );
});

/// Concrete implementation of [AuthRepository].
class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource remoteDataSource;
  final SecureStorageService storageService;
  final LocalAuthService localAuthService;

  AuthRepositoryImpl({
    required this.remoteDataSource,
    required this.storageService,
    required this.localAuthService,
  });

  @override
  Future<Either<Failure, UserEntity>> login({
    required String identifier,
    required String password,
  }) async {
    try {
      // Step 1: Obtain fresh CSRF token from NextAuth
      final csrfToken = await remoteDataSource.fetchCsrfToken();
      await storageService.saveCsrfToken(csrfToken);

      // Step 2: Authenticate credentials against NextAuth callback
      final authResult = await remoteDataSource.authenticateCredentials(
        identifier: identifier,
        password: password,
        csrfToken: csrfToken,
      );

      final userModel = authResult.user;
      final sessionToken = authResult.sessionToken ?? 'session_${userModel.id}';

      // Step 3: Persist session token and user profile securely
      await storageService.saveAuthToken(sessionToken);
      await storageService.saveUserData(
        id: userModel.id,
        email: userModel.email,
        role: userModel.role,
        name: userModel.name,
        username: userModel.username,
        phone: userModel.phone,
      );
      await storageService.saveUserProfileJson(jsonEncode(userModel.toJson()));

      return Right(userModel.toEntity());
    } on AuthException catch (e) {
      return Left(AuthFailure(message: e.message, statusCode: e.statusCode));
    } on NetworkException catch (e) {
      return Left(NetworkFailure(message: e.message, statusCode: e.statusCode));
    } on ValidationException catch (e) {
      return Left(
        ValidationFailure(
          message: e.message,
          statusCode: e.statusCode,
          data: e.data,
        ),
      );
    } catch (e) {
      return Left(UnknownFailure(message: 'Login failed: $e'));
    }
  }

  @override
  Future<Either<Failure, UserEntity>> loginWithBiometrics() async {
    try {
      final isAvailable = await localAuthService.isBiometricsAvailable();
      if (!isAvailable) {
        return const Left(
          AuthFailure(
            message: 'Biometric hardware is not available on this device.',
          ),
        );
      }

      final isEnrolled = await storageService.isBiometricsEnabled();
      if (!isEnrolled) {
        return const Left(
          AuthFailure(
            message: '1-Tap Biometric unlock is not enabled in your settings.',
          ),
        );
      }

      final hasToken = await storageService.getAuthToken();
      if (hasToken == null || hasToken.isEmpty) {
        return const Left(
          AuthFailure(
            message: 'No saved session found. Please log in with password first.',
          ),
        );
      }

      final authenticated = await localAuthService.authenticate(
        localizedReason: 'Scan fingerprint or Face ID to access Lamka Coaching Center',
      );

      if (!authenticated) {
        return const Left(
          AuthFailure(message: 'Biometric authentication was cancelled or failed.'),
        );
      }

      // Restore cached user profile
      final cachedResult = await getCachedUser();
      final user = cachedResult.rightOrNull;
      if (user != null) {
        return Right(user);
      }

      return const Left(
        AuthFailure(
          message: 'Saved session profile could not be loaded. Please log in with your password.',
        ),
      );
    } catch (e) {
      return Left(UnknownFailure(message: 'Biometric authentication error: $e'));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await storageService.clearSession();
      return const Right(null);
    } catch (e) {
      return Left(StorageFailure(message: 'Failed to clear session: $e'));
    }
  }

  @override
  Future<Either<Failure, UserEntity?>> getCachedUser() async {
    try {
      // 1. Try reading complete JSON string
      final jsonStr = await storageService.getUserProfileJson();
      if (jsonStr != null && jsonStr.isNotEmpty) {
        final map = jsonDecode(jsonStr) as Map<String, dynamic>;
        final model = UserModel.fromJson(map);
        return Right(model.toEntity());
      }

      // 2. Fallback to individual fields
      final userId = await storageService.getUserId();
      final userRole = await storageService.getUserRole();
      if (userId != null && userRole != null) {
        final name = await storageService.getUserName() ?? 'Student';
        final email = await storageService.getUserEmail();
        final username = await storageService.getUserUsername();
        final phone = await storageService.getUserPhone();

        final entity = UserEntity(
          id: userId,
          name: name,
          email: email,
          username: username,
          phone: phone,
          role: UserRole.fromString(userRole),
        );
        return Right(entity);
      }

      return const Right(null);
    } catch (e) {
      return Left(CacheFailure(message: 'Failed to read cached user profile: $e'));
    }
  }

  @override
  Future<bool> isBiometricsAvailable() async {
    return await localAuthService.isBiometricsAvailable();
  }

  @override
  Future<bool> isBiometricsEnrolled() async {
    return await storageService.isBiometricsEnabled();
  }

  @override
  Future<void> setBiometricsEnrolled(bool enabled) async {
    await storageService.setBiometricsEnabled(enabled);
  }
}
