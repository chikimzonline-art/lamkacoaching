import 'dart:io';

import 'package:dio/dio.dart';

/// Interceptor that retries failed requests with exponential backoff
/// for transient network failures and 502/503/504 server errors.
class RetryInterceptor extends Interceptor {
  final Dio dio;
  final int maxRetries;
  final Duration retryInterval;

  RetryInterceptor({
    required this.dio,
    this.maxRetries = 2,
    this.retryInterval = const Duration(milliseconds: 1000),
  });

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final extra = err.requestOptions.extra;
    final retryCount = (extra['retry_count'] as int?) ?? 0;

    final shouldRetry = _isRetryable(err) && retryCount < maxRetries;

    if (shouldRetry) {
      extra['retry_count'] = retryCount + 1;
      final delay = retryInterval * (retryCount + 1);

      await Future.delayed(delay);

      try {
        final response = await dio.fetch(err.requestOptions);
        return handler.resolve(response);
      } on DioException catch (retryErr) {
        return handler.next(retryErr);
      } catch (e) {
        return handler.next(err);
      }
    }

    return handler.next(err);
  }

  bool _isRetryable(DioException err) {
    if (err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.sendTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        err.type == DioExceptionType.connectionError) {
      return true;
    }

    if (err.error is SocketException) {
      return true;
    }

    final statusCode = err.response?.statusCode;
    if (statusCode != null &&
        (statusCode == 502 || statusCode == 503 || statusCode == 504)) {
      return true;
    }

    return false;
  }
}
