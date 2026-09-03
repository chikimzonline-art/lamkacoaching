/// Typed secure storage and shared preference keys.
class StorageKeys {
  StorageKeys._();

  static const String authToken = 'auth_token';
  static const String refreshToken = 'refresh_token';
  static const String csrfToken = 'csrf_token';
  static const String userId = 'user_id';
  static const String userRole = 'user_role';
  static const String userEmail = 'user_email';
  static const String userName = 'user_name';
  static const String userUsername = 'user_username';
  static const String userPhone = 'user_phone';
  static const String userProfile = 'user_profile_json';

  static const String isBiometricsEnabled = 'is_biometrics_enabled';
  static const String biometricToken = 'biometric_session_token';
  static const String biometricUserProfile = 'biometric_user_profile_json';
  static const String rememberMe = 'remember_me';
  static const String themeMode = 'app_theme_mode';
  static const String pushToken = 'fcm_push_token';
}
