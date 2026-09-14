# Razorpay ProGuard Rules
-keepattributes *Annotation*
-dontwarn com.razorpay.**
-keep class com.razorpay.** {*;}
-optimizations !method/inlining/*
-keepclasseswithmembers class * {
  public void onPayment*(...);
}

# Flutter Local Notifications
-keep class com.dexterous.flutterlocalnotifications.** { *; }

# Firebase Messaging
-dontwarn com.google.firebase.messaging.**
-keep class com.google.firebase.messaging.** { *; }
-keep class io.flutter.plugins.firebase.messaging.** { *; }

# Local Auth (Biometrics)
-keep class io.flutter.plugins.localauth.** { *; }

# Mobile Scanner (ML Kit)
-keep class dev.steenbakker.mobile_scanner.** { *; }
-keep class com.google.mlkit.** { *; }
-dontwarn com.google.mlkit.**

# Flutter Native Embedding Entry Points
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.**  { *; }

# Flutter Play Store Deferred Components (optional, unused)
-dontwarn com.google.android.play.core.**


