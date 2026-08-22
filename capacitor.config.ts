import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor Configuration for Lamka Coaching Center
 * 
 * Model A (Live Web Bridge):
 * - In local development (dev mode): server points to http://localhost:3000/login (or LAN IP)
 * - In production release: server points to https://lamkacoaching.in/login
 */
const isProd = process.env.CAP_ENV === 'production';
const serverUrl =
  process.env.CAPACITOR_SERVER_URL ||
  (isProd ? 'https://lamkacoaching.in/login' : 'http://localhost:3000/login');

const config: CapacitorConfig = {
  appId: 'com.lamkacoaching.app',
  appName: 'Lamka Coaching',
  webDir: 'public',
  server: {
    url: serverUrl,
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      '*.lamkacoaching.in',
      'lamkacoaching.in',
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
      launchShowDuration: 3000,
      launchAutoHide: false,
      backgroundColor: '#FFFFFF',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#050B44',
      style: 'DARK',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: false,
    webContentsDebuggingEnabled: true,
  },
};

export default config;
