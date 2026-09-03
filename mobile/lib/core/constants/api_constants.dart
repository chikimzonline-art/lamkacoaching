import 'dart:io';

import 'package:flutter/foundation.dart';

/// Centralized API endpoint constants and configuration.
class ApiConstants {
  ApiConstants._();

  // Determine local vs staging vs production environment
  static String get baseUrl {
    if (kReleaseMode) {
      return 'https://lamkacoaching.com';
    }
    // Android emulator cannot access localhost directly; it uses 10.0.2.2
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:3000';
    }
    // iOS simulator / macOS / Windows desktop
    return 'http://127.0.0.1:3000';
  }

  // Network Timeouts
  static const Duration connectTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);

  // Razorpay Public Client Key
  static const String razorpayKey = String.fromEnvironment(
    'RAZORPAY_KEY',
    defaultValue: 'rzp_test_TOLklKfn3cRx4x',
  );

  // Authentication & NextAuth Session Endpoints
  static const String csrfEndpoint = '/api/auth/csrf';
  static const String credentialsCallbackEndpoint = '/api/auth/callback/credentials';
  static const String sessionEndpoint = '/api/auth/session';
  static const String loginEndpoint = '/api/auth/login';
  static const String refreshEndpoint = '/api/auth/refresh';
  static const String logoutEndpoint = '/api/auth/logout';
  static const String meEndpoint = '/api/auth/me';

  // Feature Endpoints
  static const String adminOverviewEndpoint = '/api/admin/overview';
  static const String cabinsEndpoint = '/api/cabins';
  static const String publicCabinsEndpoint = '/api/public/cabins';
  static const String studentCabinsEndpoint = '/api/student/cabins';
  static const String cabinBookingsEndpoint = '/api/cabins/bookings';
  static const String bookingsEndpoint = '/api/bookings';
  static const String createPaymentOrderEndpoint = '/api/payments/create-order';
  static const String renewBookingOrderEndpoint = '/api/student/bookings/renew-order';
  static const String coursesEndpoint = '/api/courses';
  static const String publicCoursesEndpoint = '/api/public/courses';
  static const String publicNoticesEndpoint = '/api/public/notices';
  static const String dailyQuoteEndpoint = '/api/public/daily-quote';
  static const String studentEnrollmentsEndpoint = '/api/student/enrollments';
  static const String studentWaitlistEndpoint = '/api/student/waitlist';
  static const String notificationsEndpoint = '/api/notifications';
  static const String attendanceEndpoint = '/api/attendance';
  static const String attendanceSelfEndpoint = '/api/attendance/self';
  static const String studyMaterialsEndpoint = '/api/study-materials';
  static const String verifyQrEndpoint = '/api/cabins/verify-qr';
}
