import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Firebase Messaging is not supported on Windows. 
  // We bypass initialization on Windows to allow UI testing.
  if (kIsWeb || Platform.isAndroid || Platform.isIOS || Platform.isMacOS) {
    try {
      await Firebase.initializeApp();
    } catch (e) {
      debugPrint('Firebase initialization error: $e');
    }
  }

  runApp(const ProviderScope(child: LamkaApp()));
}
