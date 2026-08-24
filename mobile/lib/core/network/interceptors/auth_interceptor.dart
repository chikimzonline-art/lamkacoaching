import 'package:dio/dio.dart';

import '../../security/secure_storage_service.dart';

/// Interceptor that attaches Bearer JWT authentication tokens to outgoing requests.
class AuthInterceptor extends Interceptor {
  final SecureStorageService _storageService;

  AuthInterceptor(this._storageService);

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    try {
      final token = await _storageService.getAuthToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
        options.headers['Cookie'] =
            'next-auth.session-token=$token; __Secure-next-auth.session-token=$token';
      }
    } catch (_) {
      // Continue without token if read fails
    }

    options.headers['Accept'] = 'application/json';
    options.headers['Content-Type'] = 'application/json';

    return handler.next(options);
  }
}
