'use client';

import React from 'react';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { useNetworkStatus } from '@/components/providers/network-status-provider';

interface OfflineBannerProps {
  lastSyncTime?: string | null;
  className?: string;
  onRefresh?: () => void;
}

export function OfflineBanner({ lastSyncTime, className = '', onRefresh }: OfflineBannerProps) {
  const { isOnline } = useNetworkStatus();

  // If online and no explicit cached view, don't show
  if (isOnline && !lastSyncTime) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 text-amber-900 rounded-xl text-xs sm:text-sm font-medium shadow-xs transition-all ${className}`}
      role="status"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-700 shrink-0">
          <WifiOff className="h-4 w-4" />
        </div>
        <div>
          <span className="font-semibold text-amber-900">
            {!isOnline ? 'You are currently offline' : 'Viewing cached offline version'}
          </span>
          {lastSyncTime && (
            <p className="text-[11px] text-amber-700/90 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3 inline shrink-0" />
              Last synced: {lastSyncTime}
            </p>
          )}
        </div>
      </div>

      {onRefresh && isOnline && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 text-xs font-semibold transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Sync now
        </button>
      )}
    </div>
  );
}
