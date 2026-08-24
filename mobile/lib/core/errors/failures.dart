/// Abstract base class for domain failures.
abstract class Failure {
  final String message;
  final int? statusCode;
  final dynamic data;

  const Failure({required this.message, this.statusCode, this.data});

  @override
  String toString() =>
      '$runtimeType(message: $message, statusCode: $statusCode)';
}

/// Network-related failure (e.g. no internet, timeout).
class NetworkFailure extends Failure {
  const NetworkFailure({
    super.message = 'No internet connection or network timed out. Please check your connection.',
    super.statusCode,
  });
}

/// Authentication and authorization failure (401, 403, invalid session).
class AuthFailure extends Failure {
  const AuthFailure({
    super.message = 'Session expired or unauthorized. Please log in again.',
    super.statusCode = 401,
  });
}

/// Server-side internal failure (500, 502, 503).
class ServerFailure extends Failure {
  const ServerFailure({
    super.message = 'A server error occurred. Please try again shortly.',
    super.statusCode = 500,
    super.data,
  });
}

/// Validation failure for invalid user inputs or payload errors (400, 422).
class ValidationFailure extends Failure {
  const ValidationFailure({
    required super.message,
    super.statusCode = 400,
    super.data,
  });
}

/// Resource not found (404).
class NotFoundFailure extends Failure {
  const NotFoundFailure({
    super.message = 'The requested item or resource could not be found.',
    super.statusCode = 404,
  });
}

/// Cache or local storage read/write failure.
class CacheFailure extends Failure {
  const CacheFailure({
    super.message = 'Failed to read or write local offline data.',
    super.statusCode,
  });
}

/// Generic unexpected failure.
class UnknownFailure extends Failure {
  const UnknownFailure({
    super.message = 'An unexpected error occurred. Please try again.',
    super.statusCode,
    super.data,
  });
}
