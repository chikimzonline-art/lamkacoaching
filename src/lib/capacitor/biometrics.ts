import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { Preferences } from '@capacitor/preferences';
import { isNativePlatform } from './bridge';

const BIOMETRIC_ENABLED_KEY = 'lamka_biometric_enabled';
const BIOMETRIC_USER_IDENTIFIER = 'lamka_bio_identifier';
const BIOMETRIC_USER_PASSWORD = 'lamka_bio_password';
const BIOMETRIC_USER_ROLE = 'lamka_bio_role';

export interface BiometricStatus {
  isAvailable: boolean;
  biometryType: 'fingerprint' | 'face' | 'iris' | 'none';
  isEnabled: boolean;
  hasStoredCredentials: boolean;
}

/**
 * Checks if biometric authentication hardware is available and enrolled on the device.
 */
export async function getBiometricStatus(): Promise<BiometricStatus> {
  if (!isNativePlatform()) {
    return {
      isAvailable: false,
      biometryType: 'none',
      isEnabled: false,
      hasStoredCredentials: false,
    };
  }

  try {
    const info = await BiometricAuth.checkBiometry();
    const { value: isEnabledVal } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
    const { value: storedUser } = await Preferences.get({ key: BIOMETRIC_USER_IDENTIFIER });

    let biometryType: 'fingerprint' | 'face' | 'iris' | 'none' = 'none';
    if (
      info.biometryType === BiometryType.fingerprintAuthentication ||
      info.biometryType === BiometryType.touchId
    ) {
      biometryType = 'fingerprint';
    } else if (
      info.biometryType === BiometryType.faceAuthentication ||
      info.biometryType === BiometryType.faceId
    ) {
      biometryType = 'face';
    } else if (info.biometryType === BiometryType.irisAuthentication) {
      biometryType = 'iris';
    }

    return {
      isAvailable: info.isAvailable,
      biometryType,
      isEnabled: isEnabledVal === 'true',
      hasStoredCredentials: Boolean(storedUser),
    };
  } catch (err) {
    console.warn('[Biometrics] Failed to check biometry status', err);
    return {
      isAvailable: false,
      biometryType: 'none',
      isEnabled: false,
      hasStoredCredentials: false,
    };
  }
}

/**
 * Triggers native Android BiometricPrompt (Fingerprint / Face Unlock).
 */
export async function authenticateWithBiometrics(
  reason = 'Verify your identity to sign in to Lamka Coaching'
): Promise<boolean> {
  if (!isNativePlatform()) return false;

  try {
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
    });
    return true;
  } catch (err: any) {
    console.warn('[Biometrics] Authentication failed or cancelled', err?.message || err);
    return false;
  }
}

/**
 * Securely stores credentials for 1-tap biometric login.
 */
export async function saveBiometricCredentials(
  identifier: string,
  password: string,
  role = 'student'
): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await Preferences.set({ key: BIOMETRIC_ENABLED_KEY, value: 'true' });
    await Preferences.set({ key: BIOMETRIC_USER_IDENTIFIER, value: identifier });
    await Preferences.set({ key: BIOMETRIC_USER_PASSWORD, value: password });
    await Preferences.set({ key: BIOMETRIC_USER_ROLE, value: role });
  } catch (err) {
    console.error('[Biometrics] Failed to save biometric credentials', err);
  }
}

/**
 * Authenticates with fingerprint and returns decrypted credentials for NextAuth auto-login.
 */
export async function getBiometricCredentials(): Promise<{
  identifier: string;
  password: string;
  role: string;
} | null> {
  if (!isNativePlatform()) return null;

  try {
    const verified = await authenticateWithBiometrics(
      'Verify fingerprint to sign in to Lamka Coaching'
    );
    if (!verified) return null;

    const { value: identifier } = await Preferences.get({ key: BIOMETRIC_USER_IDENTIFIER });
    const { value: password } = await Preferences.get({ key: BIOMETRIC_USER_PASSWORD });
    const { value: role } = await Preferences.get({ key: BIOMETRIC_USER_ROLE });

    if (!identifier || !password) return null;

    return {
      identifier,
      password,
      role: role || 'student',
    };
  } catch (err) {
    console.error('[Biometrics] Error retrieving credentials', err);
    return null;
  }
}

/**
 * Clears stored biometric credentials on logout or when disabled in settings.
 */
export async function clearBiometricCredentials(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await Preferences.remove({ key: BIOMETRIC_ENABLED_KEY });
    await Preferences.remove({ key: BIOMETRIC_USER_IDENTIFIER });
    await Preferences.remove({ key: BIOMETRIC_USER_PASSWORD });
    await Preferences.remove({ key: BIOMETRIC_USER_ROLE });
  } catch (err) {
    console.warn('[Biometrics] Failed to clear credentials', err);
  }
}
