'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isNativePlatform } from '@/lib/capacitor/bridge';
import { cn } from '@/lib/utils';

interface NetworkStatusContextType {
  isOnline: boolean;
  connectionType?: string;
}

const NetworkStatusContext = createContext<NetworkStatusContextType>({
  isOnline: true,
  connectionType: 'unknown',
});

export function useNetworkStatus(): NetworkStatusContextType {
  return useContext(NetworkStatusContext);
}

export default function NetworkStatusProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [justReconnected, setJustReconnected] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    const setupNativeListener = async () => {
      if (!isNativePlatform()) {
        // Web fallback — listen to browser online/offline events
        const handleOnline = () => {
          setIsOnline(true);
          setJustReconnected(true);
          setTimeout(() => {
            setJustReconnected(false);
            setVisible(false);
          }, 2500);
        };
        const handleOffline = () => {
          setIsOnline(false);
          setVisible(true);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }

      try {
        const { Network } = await import('@capacitor/network');

        // Check initial status
        const status = await Network.getStatus();
        setIsOnline(status.connected);
        setConnectionType(status.connectionType || 'unknown');
        if (!status.connected) setVisible(true);

        // Listen for changes
        const handle = await Network.addListener('networkStatusChange', (status) => {
          setIsOnline(status.connected);
          setConnectionType(status.connectionType || 'unknown');
          if (status.connected) {
            setJustReconnected(true);
            setVisible(true);
            setTimeout(() => {
              setJustReconnected(false);
              setVisible(false);
            }, 2500);
          } else {
            setVisible(true);
          }
        });

        unlistenFn = () => handle.remove();
      } catch {
        // Network plugin not available, ignore
      }
    };

    setupNativeListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, []);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, connectionType }}>
      {children}

      {/* Offline / Reconnected Banner */}
      {visible && (
        <div
          className={cn(
            'fixed top-0 inset-x-0 z-[9999] flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium transition-all duration-300',
            justReconnected
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-white'
          )}
        >
          {justReconnected ? (
            <>
              <Wifi className="h-4 w-4" />
              Back online!
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 animate-pulse" />
              You are offline. Showing cached data.
            </>
          )}
        </div>
      )}
    </NetworkStatusContext.Provider>
  );
}
