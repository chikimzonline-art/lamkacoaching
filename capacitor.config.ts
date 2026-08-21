import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for Lamka Coaching Center
 * 
 * Model A (Live Web Bridge):
 * - In local development, server points to http://10.0.2.2:3000 (standard Android emulator loopback to host) or LAN IP.
 * - For production release, server points to your hosted domain (e.g. https://lamkacoaching.com).
 */
const serverUrl = process.env.CAPACITOR_SERVER_URL || 'http://10.0.2.2:3000';

const config: CapacitorConfig = {
  appId: 'com.lamkacoaching.app',
  appName: 'Lamka Coaching',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      '*.lamkacoaching.com',
      'lamkacoaching.com',
      'localhost',
      '10.0.2.2',
      '192.168.*',
      '*.vercel.app'
    ],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: false,
      backgroundColor: '#050B44',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#050B44',
      style: 'DARK',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: process.env.NODE_ENV !== 'production',
  },
};

export default config;
