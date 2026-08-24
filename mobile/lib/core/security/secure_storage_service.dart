import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/storage_keys.dart';
import '../errors/exceptions.dart';

/// Riverpod provider for the global SecureStorageService instance.
final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  const storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );
  return SecureStorageService(storage);
});

/// High-level encrypted key-value storage service.
class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService(this._storage);

  // ----------------------------------------------------
  // Generic Read / Write / Delete
  // ----------------------------------------------------
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      throw StorageException(message: 'Failed to write key "$key": $e');
    }
  }

  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      throw StorageException(message: 'Failed to read key "$key": $e');
    }
  }

  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      throw StorageException(message: 'Failed to delete key "$key": $e');
    }
  }

  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      throw StorageException(message: 'Failed to delete all keys: $e');
    }
  }

  // ----------------------------------------------------
  // Typed Auth & Token Helpers
  // ----------------------------------------------------
  Future<void> saveAuthToken(String token) async {
    await write(StorageKeys.authToken, token);
  }

  Future<String?> getAuthToken() async {
    return await read(StorageKeys.authToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await write(StorageKeys.refreshToken, token);
  }

  Future<String?> getRefreshToken() async {
    return await read(StorageKeys.refreshToken);
  }

  Future<void> saveUserData({
    required String id,
    required String email,
    required String role,
    String? name,
  }) async {
    await write(StorageKeys.userId, id);
    await write(StorageKeys.userEmail, email);
    await write(StorageKeys.userRole, role);
    if (name != null) {
      await write(StorageKeys.userName, name);
    }
  }

  Future<String?> getUserId() async => await read(StorageKeys.userId);
  Future<String?> getUserRole() async => await read(StorageKeys.userRole);
  Future<String?> getUserEmail() async => await read(StorageKeys.userEmail);
  Future<String?> getUserName() async => await read(StorageKeys.userName);

  // ----------------------------------------------------
  // Biometric & Preference Helpers
  // ----------------------------------------------------
  Future<void> setBiometricsEnabled(bool enabled) async {
    await write(StorageKeys.isBiometricsEnabled, enabled ? 'true' : 'false');
  }

  Future<bool> isBiometricsEnabled() async {
    final val = await read(StorageKeys.isBiometricsEnabled);
    return val == 'true';
  }

  // ----------------------------------------------------
  // Session Clear
  // ----------------------------------------------------
  Future<void> clearSession() async {
    await delete(StorageKeys.authToken);
    await delete(StorageKeys.refreshToken);
    await delete(StorageKeys.userId);
    await delete(StorageKeys.userEmail);
    await delete(StorageKeys.userRole);
    await delete(StorageKeys.userName);
    await delete(StorageKeys.userProfile);
  }
}
