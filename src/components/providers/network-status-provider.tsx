'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
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
  const [connectionType] = useState<string>('unknown');
  const [justReconnected, setJustReconnected] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      setVisible(true);
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
