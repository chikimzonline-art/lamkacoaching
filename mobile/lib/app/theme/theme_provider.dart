import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/security/secure_storage_service.dart';

/// State notifier provider for dynamic application ThemeMode (Dark, Light, System)
final themeModeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((
  ref,
) {
  final storageService = ref.watch(secureStorageServiceProvider);
  return ThemeModeNotifier(storageService);
});

class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  final SecureStorageService _storageService;
  static const _themeStorageKey = 'app_theme_mode';

  ThemeModeNotifier(this._storageService) : super(ThemeMode.dark) {
    _loadPersistedTheme();
  }

  Future<void> _loadPersistedTheme() async {
    try {
      final savedMode = await _storageService.read(_themeStorageKey);
      if (savedMode == 'light') {
        state = ThemeMode.light;
      } else if (savedMode == 'dark') {
        state = ThemeMode.dark;
      } else if (savedMode == 'system') {
        state = ThemeMode.system;
      }
    } catch (_) {
      // Default to dark mode on error
      state = ThemeMode.dark;
    }
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = mode;
    final modeString = mode == ThemeMode.light
        ? 'light'
        : mode == ThemeMode.dark
        ? 'dark'
        : 'system';
    await _storageService.write(_themeStorageKey, modeString);
  }

  void toggleTheme() {
    if (state == ThemeMode.dark) {
      setThemeMode(ThemeMode.light);
    } else {
      setThemeMode(ThemeMode.dark);
    }
  }
}
