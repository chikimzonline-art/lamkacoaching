import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Riverpod provider for local database management.
final localDatabaseServiceProvider = Provider<LocalDatabaseService>((ref) {
  return LocalDatabaseService();
});

/// Backwards-compatibility alias for previous provider name
final isarDatabaseServiceProvider = localDatabaseServiceProvider;

/// Lightweight local database stub for offline state caching.
class LocalDatabaseService {
  bool _isInitialized = false;

  bool get isInitialized => _isInitialized;

  /// Initialize local database resources.
  Future<void> initialize() async {
    _isInitialized = true;
  }

  /// Close and clean up resources.
  Future<void> close() async {
    _isInitialized = false;
  }

  /// Clear stored caches for session logout or hard reset.
  Future<void> clearAll() async {
    _isInitialized = false;
  }
}

/// Backwards-compatibility class alias
typedef IsarDatabaseService = LocalDatabaseService;
