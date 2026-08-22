import { isNativePlatform } from './bridge';

/**
 * Requests camera permissions on Android.
 * Returns true if granted.
 */
export async function requestCameraPermissions(): Promise<boolean> {
  if (!isNativePlatform()) return true; // Web: assume granted
  try {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
    const status = await BarcodeScanner.checkPermissions();
    if (status.camera === 'granted') return true;
    const requested = await BarcodeScanner.requestPermissions();
    return requested.camera === 'granted';
  } catch (err) {
    console.warn('[QRScanner] Permission request failed', err);
    return false;
  }
}

export interface QrScanResult {
  rawValue: string;
  format: string;
}

/**
 * Opens the native ML Kit camera scanner overlay.
 * Returns the first QR / barcode scanned or null on cancel.
 */
export async function startQrScan(): Promise<QrScanResult | null> {
  if (!isNativePlatform()) {
    // On web, return null (scanner not available)
    return null;
  }

  try {
    const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');
    const granted = await requestCameraPermissions();
    if (!granted) return null;

    const result = await BarcodeScanner.scan({
      formats: [BarcodeFormat.QrCode],
    });

    if (result.barcodes && result.barcodes.length > 0) {
      return {
        rawValue: result.barcodes[0].rawValue ?? '',
        format: result.barcodes[0].format ?? 'QR_CODE',
      };
    }
    return null;
  } catch (err) {
    console.warn('[QRScanner] Scan failed or cancelled', err);
    return null;
  }
}

/**
 * Stops any active scanner session (cleanup).
 */
export async function stopQrScan(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning');
    await BarcodeScanner.removeAllListeners();
  } catch {
    // Ignore
  }
}
