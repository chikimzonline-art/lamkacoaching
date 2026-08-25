import '../../domain/user_entity.dart';

/// Sealed representation of all authentication states.
sealed class AuthState {
  const AuthState();

  bool get isAuthenticated => this is Authenticated;
  bool get isLoading => this is Authenticating;
  bool get biometricsAvailable => this is Unauthenticated
      ? (this as Unauthenticated).biometricsAvailable
      : this is AuthFailureState
          ? (this as AuthFailureState).biometricsAvailable
          : false;
  bool get biometricsEnrolled => this is Unauthenticated
      ? (this as Unauthenticated).biometricsEnrolled
      : this is AuthFailureState
          ? (this as AuthFailureState).biometricsEnrolled
          : false;
  bool get canUseBiometrics => this is Unauthenticated
      ? (this as Unauthenticated).canUseBiometrics
      : this is AuthFailureState
          ? (this as AuthFailureState).canUseBiometrics
          : false;
  UserEntity? get user => this is Authenticated ? (this as Authenticated).user : null;
}

/// Initial state when application starts before session check.
class AuthInitial extends AuthState {
  const AuthInitial();
}

/// State when no active session is authenticated.
class Unauthenticated extends AuthState {
  final String? message;
  @override
  final bool biometricsAvailable;
  @override
  final bool biometricsEnrolled;

  const Unauthenticated({
    this.message,
    this.biometricsAvailable = false,
    this.biometricsEnrolled = false,
  });

  @override
  bool get canUseBiometrics => biometricsAvailable && biometricsEnrolled;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Unauthenticated &&
          other.message == message &&
          other.biometricsAvailable == biometricsAvailable &&
          other.biometricsEnrolled == biometricsEnrolled);

  @override
  int get hashCode =>
      message.hashCode ^
      biometricsAvailable.hashCode ^
      biometricsEnrolled.hashCode;

  @override
  String toString() =>
      'Unauthenticated(biometricsAvailable: $biometricsAvailable, biometricsEnrolled: $biometricsEnrolled, message: $message)';
}

/// State during an active login or biometric verification process.
class Authenticating extends AuthState {
  final String? statusMessage;

  const Authenticating({this.statusMessage});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Authenticating && other.statusMessage == statusMessage);

  @override
  int get hashCode => statusMessage.hashCode;

  @override
  String toString() => 'Authenticating(statusMessage: $statusMessage)';
}

/// State when a user has a valid authenticated session.
class Authenticated extends AuthState {
  @override
  final UserEntity user;
  final bool justLoggedIn;

  const Authenticated(this.user, {this.justLoggedIn = false});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is Authenticated &&
          other.user == user &&
          other.justLoggedIn == justLoggedIn);

  @override
  int get hashCode => user.hashCode ^ justLoggedIn.hashCode;

  @override
  String toString() => 'Authenticated(user: ${user.name}, role: ${user.role.name})';
}

/// State when an authentication attempt fails.
class AuthFailureState extends AuthState {
  final String message;
  @override
  final bool biometricsAvailable;
  @override
  final bool biometricsEnrolled;

  const AuthFailureState({
    required this.message,
    this.biometricsAvailable = false,
    this.biometricsEnrolled = false,
  });

  @override
  bool get canUseBiometrics => biometricsAvailable && biometricsEnrolled;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is AuthFailureState &&
          other.message == message &&
          other.biometricsAvailable == biometricsAvailable &&
          other.biometricsEnrolled == biometricsEnrolled);

  @override
  int get hashCode =>
      message.hashCode ^
      biometricsAvailable.hashCode ^
      biometricsEnrolled.hashCode;

  @override
  String toString() => 'AuthFailureState(message: $message)';
}

