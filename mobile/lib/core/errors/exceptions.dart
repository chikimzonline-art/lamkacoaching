/// Base class for all application-level exceptions.
class AppException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  const AppException({required this.message, this.statusCode, this.data});

  @override
  String toString() =>
      '$runtimeType(message: $message, statusCode: $statusCode)';
}

/// Thrown when an HTTP or socket request fails.
class NetworkException extends AppException {
  const NetworkException({
    super.message = 'Network error or timeout occurred.',
    super.statusCode,
  });
}

/// Thrown when unauthorized or token validation fails.
class AuthException extends AppException {
  const AuthException({
    super.message = 'Unauthorized or authentication token is invalid.',
    super.statusCode = 401,
  });
}

/// Thrown when server returns 5xx error.
class ServerException extends AppException {
  const ServerException({
    super.message = 'Internal server error.',
    super.statusCode = 500,
    super.data,
  });
}

/// Thrown for validation / input errors.
class ValidationException extends AppException {
  const ValidationException({
    required super.message,
    super.statusCode = 400,
    super.data,
  });
}

/// Thrown when local cache or secure storage fails.
class StorageException extends AppException {
  const StorageException({
    super.message = 'Storage read/write operation failed.',
    super.statusCode,
  });
}
