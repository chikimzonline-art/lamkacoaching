# Add project specific ProGuard rules here.
# For more details, see: http://developer.android.com/guide/developing/tools/proguard.html

# Preserve Capacitor core and plugins
-keep public class com.getcapacitor.** { *; }
-keep public class * extends com.getcapacitor.Plugin { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    public *;
}
-keepclassmembers class com.getcapacitor.Bridge {
    public *;
}

# Preserve App Plugins in MainActivity
-keep class com.lamkacoaching.app.** { *; }

# Preserve Google MLKit Barcode Scanning
-keep class com.google.mlkit.vision.barcode.** { *; }
-keep class com.google.android.gms.vision.** { *; }

# Preserve Biometric Authentication
-keep class androidx.biometric.** { *; }

# Preserve AndroidX Core and Splash Screen
-keep class androidx.core.splashscreen.** { *; }

# Preserve line numbers for stack traces in Sentry / Crashlytics
-keepattributes SourceFile,LineNumberTable,*Annotation*
