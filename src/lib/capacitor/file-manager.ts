import { isNativePlatform } from './bridge';

/**
 * Saves a Base64-encoded PDF to Android's public Downloads folder.
 * On web, falls back to a browser blob download.
 */
export async function savePdfToDevice(filename: string, pdfBase64: string): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      await Filesystem.writeFile({
        path: `Download/${filename}`,
        data: pdfBase64,
        directory: Directory.ExternalStorage,
        recursive: true,
      });
      return true;
    } catch (err) {
      console.warn('[FileManager] Failed to save PDF to device', err);
      return false;
    }
  } else {
    // Web fallback: browser download
    try {
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = Array.from(byteCharacters, (c) => c.charCodeAt(0));
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Opens the native Android Share Sheet.
 * Falls back to Web Share API on web, or copies to clipboard if unavailable.
 */
export async function shareContent(options: ShareOptions): Promise<void> {
  if (isNativePlatform()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        dialogTitle: options.dialogTitle || options.title,
      });
    } catch (err) {
      console.warn('[FileManager] Share failed', err);
    }
  } else {
    // Web Share API fallback
    if (navigator.share) {
      try {
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
        });
      } catch {
        // User cancelled or not supported
      }
    } else if (options.url) {
      await navigator.clipboard.writeText(options.url);
    }
  }
}
