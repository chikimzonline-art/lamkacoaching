import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/constants/api_constants.dart';
import '../../../../core/errors/exceptions.dart';
import '../../../../core/network/dio_client.dart';
import 'user_model.dart';

/// Riverpod provider for the [AuthRemoteDataSource].
final authRemoteDataSourceProvider = Provider<AuthRemoteDataSource>((ref) {
  final dioClient = ref.watch(dioClientProvider);
  return AuthRemoteDataSource(dioClient);
});

/// Remote data source communicating directly with NextAuth API endpoints.
class AuthRemoteDataSource {
  final DioClient _dioClient;
  String? _csrfCookie;

  AuthRemoteDataSource(this._dioClient);

  /// Fetches the NextAuth CSRF token from `GET /api/auth/csrf`.
  Future<String> fetchCsrfToken() async {
    try {
      final response = await _dioClient.get<Map<String, dynamic>>(
        ApiConstants.csrfEndpoint,
      );

      final setCookies = response.headers['set-cookie'];
      if (setCookies != null && setCookies.isNotEmpty) {
        _csrfCookie = setCookies.map((c) => c.split(';').first).join('; ');
      }

      final data = response.data;
      if (data != null && data['csrfToken'] != null) {
        return data['csrfToken'].toString();
      }

      throw const AuthException(
        message: 'Failed to retrieve CSRF authentication token from server.',
      );
    } on DioException catch (e) {
      if (e.error is AppException) {
        throw e.error as AppException;
      }
      throw NetworkException(
        message: e.message ?? 'Network error while fetching CSRF token.',
      );
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException(message: 'Unexpected error fetching CSRF token: $e');
    }
  }

  /// Sends credentials (username/phone/email and password) to NextAuth callback.
  /// Calls `POST /api/auth/callback/credentials`.
  /// Returns a map with session metadata and extracted user model if present.
  Future<({UserModel user, String? sessionToken})> authenticateCredentials({
    required String identifier,
    required String password,
    required String csrfToken,
  }) async {
    try {
      final payload = {
        'username': identifier.trim(),
        'password': password,
        'csrfToken': csrfToken,
        'redirect': 'false',
        'json': 'true',
        'callbackUrl': '/dashboard',
      };

      final response = await _dioClient.post<dynamic>(
        ApiConstants.credentialsCallbackEndpoint,
        data: payload,
        options: Options(
          contentType: Headers.formUrlEncodedContentType,
          headers: {
            if (_csrfCookie != null && _csrfCookie!.isNotEmpty)
              'Cookie': _csrfCookie,
          },
          validateStatus: (status) => status != null && status < 500,
        ),
      );

      if (response.statusCode == 401 || response.statusCode == 403) {
        throw const AuthException(
          message: 'Invalid credentials. Please check your username/phone and password.',
          statusCode: 401,
        );
      }

      // Check if response contains an error query or message
      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['error'] != null && data['error'].toString().isNotEmpty) {
          throw AuthException(
            message: data['error'] == 'CredentialsSignin'
                ? 'Invalid credentials. Please check your details.'
                : data['error'].toString(),
          );
        }
        if (data['url'] != null && data['url'].toString().contains('error=')) {
          throw const AuthException(
            message: 'Invalid credentials. Please check your username/phone and password.',
          );
        }
      }

      // Extract session token from Set-Cookie headers if provided
      String? sessionToken;
      final setCookieHeaders = response.headers['set-cookie'];
      if (setCookieHeaders != null) {
        for (final cookie in setCookieHeaders) {
          if (cookie.contains('next-auth.session-token=')) {
            final match = RegExp(
              r'next-auth\.session-token=([^;]+)',
            ).firstMatch(cookie);
            if (match != null) {
              sessionToken = match.group(1);
            }
          } else if (cookie.contains('__Secure-next-auth.session-token=')) {
            final match = RegExp(
              r'__Secure-next-auth\.session-token=([^;]+)',
            ).firstMatch(cookie);
            if (match != null) {
              sessionToken = match.group(1);
            }
          }
        }
      }

      // Verify active session by fetching typed session data
      final sessionUser = await fetchSession(overrideToken: sessionToken);
      if (sessionUser != null) {
        return (user: sessionUser, sessionToken: sessionToken);
      }

      // Fallback: If session endpoint returns null, construct user from response data
      if (response.data is Map<String, dynamic> &&
          (response.data as Map<String, dynamic>)['user'] != null) {
        final userJson =
            (response.data as Map<String, dynamic>)['user']
                as Map<String, dynamic>;
        return (
          user: UserModel.fromJson(userJson),
          sessionToken: sessionToken,
        );
      }

      throw const AuthException(
        message: 'Authentication failed. Please verify your credentials.',
      );
    } on DioException catch (e) {
      if (e.error is AppException) {
        throw e.error as AppException;
      }
      throw NetworkException(
        message: e.message ?? 'Network error during login.',
      );
    } catch (e) {
      if (e is AppException) rethrow;
      throw AppException(message: 'Unexpected authentication error: $e');
    }
  }

  /// Fetches the currently authenticated session profile via `GET /api/auth/session`.
  Future<UserModel?> fetchSession({String? overrideToken}) async {
    try {
      final options =
          overrideToken != null
              ? Options(
                headers: {
                  'Authorization': 'Bearer $overrideToken',
                  'Cookie':
                      'next-auth.session-token=$overrideToken; __Secure-next-auth.session-token=$overrideToken',
                },
              )
              : null;

      final response = await _dioClient.get<dynamic>(
        ApiConstants.sessionEndpoint,
        options: options,
      );

      if (response.data == null) return null;

      Map<String, dynamic>? dataMap;
      if (response.data is Map<String, dynamic>) {
        dataMap = response.data as Map<String, dynamic>;
      } else if (response.data is String &&
          (response.data as String).isNotEmpty) {
        dataMap = jsonDecode(response.data as String) as Map<String, dynamic>;
      }

      if (dataMap == null || dataMap['user'] == null) {
        return null;
      }

      final userJson = dataMap['user'] as Map<String, dynamic>;
      return UserModel.fromJson(userJson);
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        return null;
      }
      if (e.error is AppException) {
        throw e.error as AppException;
      }
      throw NetworkException(
        message: e.message ?? 'Failed to retrieve session from server.',
      );
    } catch (e) {
      if (e is AppException) rethrow;
      return null;
    }
  }

  /// Calls `POST /api/student/delete-account` to permanently purge the student account.
  Future<void> deleteAccount(String password) async {
    try {
      final response = await _dioClient.post<dynamic>(
        ApiConstants.deleteAccountEndpoint,
        data: {'password': password},
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        final errorMsg =
            response.data is Map<String, dynamic>
                ? response.data['error'] as String?
                : null;
        throw ServerException(
          message: errorMsg ?? 'Failed to delete account.',
          statusCode: response.statusCode,
        );
      }
    } on DioException catch (e) {
      if (e.error is AppException) throw e.error as AppException;
      final errorMsg =
          e.response?.data is Map<String, dynamic>
              ? e.response?.data['error'] as String?
              : null;
      throw ServerException(
        message: errorMsg ?? e.message ?? 'Failed to delete account.',
        statusCode: e.response?.statusCode,
      );
    }
  }
}
