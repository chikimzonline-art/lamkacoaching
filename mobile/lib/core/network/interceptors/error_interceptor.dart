import 'package:dio/dio.dart';

import '../../errors/exceptions.dart';

/// Interceptor that translates raw DioException types and HTTP status codes
/// into typed AppException instances.
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    AppException appException;

    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.connectionError:
        appException = NetworkException(
          message: 'Connection timed out or network is unreachable. Please check your connection.',
          statusCode: err.response?.statusCode,
        );
        break;

      case DioExceptionType.badResponse:
        final statusCode = err.response?.statusCode ?? 500;
        final responseData = err.response?.data;
        String errorMessage = 'An unexpected server error occurred.';

        if (responseData is Map<String, dynamic>) {
          errorMessage =
              responseData['error']?.toString() ??
              responseData['message']?.toString() ??
              errorMessage;
        } else if (responseData is String && responseData.isNotEmpty) {
          errorMessage = responseData;
        }

        if (statusCode == 401 || statusCode == 403) {
          appException = AuthException(
            message: errorMessage,
            statusCode: statusCode,
          );
        } else if (statusCode == 400 || statusCode == 422) {
          appException = ValidationException(
            message: errorMessage,
            statusCode: statusCode,
            data: responseData,
          );
        } else if (statusCode >= 500) {
          appException = ServerException(
            message: errorMessage,
            statusCode: statusCode,
            data: responseData,
          );
        } else {
          appException = AppException(
            message: errorMessage,
            statusCode: statusCode,
            data: responseData,
          );
        }
        break;

      case DioExceptionType.cancel:
        appException = const AppException(message: 'Request was cancelled.');
        break;

      case DioExceptionType.badCertificate:
        appException = const NetworkException(
          message: 'Invalid SSL certificate.',
        );
        break;

      case DioExceptionType.unknown:
      default:
        appException = NetworkException(
          message: err.message ?? 'A network error occurred. Please verify your internet connection.',
          statusCode: err.response?.statusCode,
        );
        break;
    }

    final transformedDioException = DioException(
      requestOptions: err.requestOptions,
      response: err.response,
      type: err.type,
      error: appException,
      message: appException.message,
    );

    return handler.next(transformedDioException);
  }
}
