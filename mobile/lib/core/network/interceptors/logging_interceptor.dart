import 'dart:developer' as developer;

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Formatted console logging for network debugging in development mode only.
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (kDebugMode) {
      developer.log(
        '🌐 [HTTP REQUEST] ${options.method} -> ${options.uri}',
        name: 'DioClient',
      );
      if (options.data != null) {
        developer.log('📦 [PAYLOAD] ${options.data}', name: 'DioClient');
      }
    }
    return handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      developer.log(
        '✅ [HTTP RESPONSE ${response.statusCode}] ${response.requestOptions.method} -> ${response.requestOptions.uri}',
        name: 'DioClient',
      );
    }
    return handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    if (kDebugMode) {
      developer.log(
        '❌ [HTTP ERROR ${err.response?.statusCode ?? 'TIMEOUT'}] ${err.requestOptions.method} -> ${err.requestOptions.uri} : ${err.message}',
        name: 'DioClient',
        error: err.error,
      );
    }
    return handler.next(err);
  }
}
