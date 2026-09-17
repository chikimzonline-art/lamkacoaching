import 'dart:io' show Platform;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase is supported on Android, iOS, macOS, Web
  if (kIsWeb || Platform.isAndroid || Platform.isIOS || Platform.isMacOS) {
    try {
      await Firebase.initializeApp();

      // Disable crash collection in debug mode so dev crashes do not pollute production metrics
      await FirebaseCrashlytics.instance
          .setCrashlyticsCollectionEnabled(!kDebugMode);

      // Pass all uncaught "fatal" errors from the framework to Crashlytics
      FlutterError.onError = (errorDetails) {
        FirebaseCrashlytics.instance.recordFlutterFatalError(errorDetails);
      };

      // Pass all uncaught asynchronous errors to Crashlytics
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };
    } catch (e) {
      debugPrint('Firebase initialization error: $e');
    }
  }

  runApp(const ProviderScope(child: LamkaApp()));
}
