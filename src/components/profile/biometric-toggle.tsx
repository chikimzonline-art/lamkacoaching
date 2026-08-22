'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  getBiometricStatus,
  clearBiometricCredentials,
  authenticateWithBiometrics,
  type BiometricStatus,
} from '@/lib/capacitor/biometrics';
import { isNativePlatform } from '@/lib/capacitor/bridge';

export function BiometricToggle({ userIdentifier }: { userIdentifier?: string }) {
  const [status, setStatus] = useState<BiometricStatus>({
    isAvailable: false,
    biometryType: 'none',
    isEnabled: false,
    hasStoredCredentials: false,
  });
  const [loading, setLoading] = useState(true);
  const isNative = isNativePlatform();

  useEffect(() => {
    if (!isNative) {
      setLoading(false);
      return;
    }

    getBiometricStatus().then((s) => {
      setStatus(s);
      setLoading(false);
    });
  }, [isNative]);

  if (!isNative || !status.isAvailable) {
    return null; // Hidden on standard web browsers or devices without biometric sensors
  }

  const handleToggle = async (enabled: boolean) => {
    if (!enabled) {
      await clearBiometricCredentials();
      setStatus((prev) => ({ ...prev, isEnabled: false, hasStoredCredentials: false }));
      toast.success('Biometric login disabled');
      return;
    }

    // Verify biometrics before enabling
    const verified = await authenticateWithBiometrics(
      'Verify your fingerprint to enable 1-tap quick login'
    );

    if (verified) {
      toast.info('Biometric authentication verified! You can now sign in with your fingerprint.');
      setStatus((prev) => ({ ...prev, isEnabled: true, hasStoredCredentials: true }));
    } else {
      toast.error('Biometric verification cancelled or failed');
    }
  };

  const biometryName =
    status.biometryType === 'face'
      ? 'Face Unlock'
      : status.biometryType === 'iris'
      ? 'Iris Scanner'
      : 'Fingerprint';

  return (
    <Card className="border border-slate-200 shadow-xs rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-100">
              <Fingerprint className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                {biometryName} Login
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Sign in instantly to your account using {biometryName} on this device.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={status.isEnabled && status.hasStoredCredentials ? 'default' : 'outline'}
            className={
              status.isEnabled && status.hasStoredCredentials
                ? 'bg-emerald-600 hover:bg-emerald-600 text-white text-[11px]'
                : 'text-slate-500 text-[11px]'
            }
          >
            {status.isEnabled && status.hasStoredCredentials ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-between py-2 border-t border-slate-100">
          <div className="space-y-0.5 pr-4">
            <p className="text-sm font-medium text-slate-800">
              Enable 1-Tap {biometryName} Sign In
            </p>
            <p className="text-xs text-slate-500">
              Credentials are encrypted using the hardware-backed Android Keystore.
            </p>
          </div>
          <Switch
            checked={status.isEnabled && status.hasStoredCredentials}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
