import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../constants/storage_keys.dart';
import '../errors/exceptions.dart';

/// Riverpod provider for the global SecureStorageService instance.
final secureStorageServiceProvider = Provider<SecureStorageService>((ref) {
  const storage = FlutterSecureStorage(
    aOptions: AndroidOptions(),
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

  Future<void> saveCsrfToken(String token) async {
    await write(StorageKeys.csrfToken, token);
  }

  Future<String?> getCsrfToken() async {
    return await read(StorageKeys.csrfToken);
  }

  Future<void> saveUserData({
    required String id,
    String? email,
    required String role,
    String? name,
    String? username,
    String? phone,
  }) async {
    await write(StorageKeys.userId, id);
    await write(StorageKeys.userRole, role);
    if (email != null) {
      await write(StorageKeys.userEmail, email);
    }
    if (name != null) {
      await write(StorageKeys.userName, name);
    }
    if (username != null) {
      await write(StorageKeys.userUsername, username);
    }
    if (phone != null) {
      await write(StorageKeys.userPhone, phone);
    }
  }

  Future<void> saveUserProfileJson(String jsonStr) async {
    await write(StorageKeys.userProfile, jsonStr);
  }

  Future<String?> getUserProfileJson() async {
    return await read(StorageKeys.userProfile);
  }

  Future<String?> getUserId() async => await read(StorageKeys.userId);
  Future<String?> getUserRole() async => await read(StorageKeys.userRole);
  Future<String?> getUserEmail() async => await read(StorageKeys.userEmail);
  Future<String?> getUserName() async => await read(StorageKeys.userName);
  Future<String?> getUserUsername() async => await read(StorageKeys.userUsername);
  Future<String?> getUserPhone() async => await read(StorageKeys.userPhone);

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
    await delete(StorageKeys.csrfToken);
    await delete(StorageKeys.userId);
    await delete(StorageKeys.userEmail);
    await delete(StorageKeys.userRole);
    await delete(StorageKeys.userName);
    await delete(StorageKeys.userUsername);
    await delete(StorageKeys.userPhone);
    await delete(StorageKeys.userProfile);
  }
}
