import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';

/// Riverpod provider for the local Isar database instance.
final isarDatabaseServiceProvider = Provider<IsarDatabaseService>((ref) {
  return IsarDatabaseService();
});

/// High-performance local embedded database for offline-first caching.
class IsarDatabaseService {
  Isar? _isar;

  Isar get isar {
    if (_isar == null || !_isar!.isOpen) {
      throw StateError(
        'Isar database is not initialized. Call initialize() before accessing.',
      );
    }
    return _isar!;
  }

  /// Initialize the local Isar database.
  Future<void> initialize({
    List<CollectionSchema<dynamic>> schemas = const [],
  }) async {
    if (_isar != null && _isar!.isOpen) return;

    final dir = await getApplicationDocumentsDirectory();
    _isar = await Isar.open(
      schemas,
      directory: dir.path,
      name: 'lamka_coaching_db',
      inspector: false,
    );
  }

  /// Close and clean up the database instance.
  Future<void> close() async {
    if (_isar != null && _isar!.isOpen) {
      await _isar!.close();
      _isar = null;
    }
  }

  /// Clear all collections for session logout or hard reset.
  Future<void> clearAll() async {
    if (_isar != null && _isar!.isOpen) {
      await _isar!.writeTxn(() async {
        await _isar!.clear();
      });
    }
  }
}
