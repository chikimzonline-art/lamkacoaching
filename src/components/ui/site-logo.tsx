'use client';

import { useSettings } from '@/components/providers/settings-provider';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SiteLogo({ size = 'default', variant = 'dark', className }: { size?: 'default' | 'small' | 'mobile'; variant?: 'dark' | 'light'; className?: string }) {
  const settings = useSettings();
  const logoUrl = settings?.logo_url || null;
  const businessName = settings?.business_name || 'Lamka Coaching';

  const nameParts = businessName.split(' ');
  const primary = nameParts.slice(0, 2).join(' ');
  const secondary = nameParts.slice(2).join(' ');

  const iconSize = size === 'small' ? 'h-7 w-7' : size === 'mobile' ? 'h-9 w-9' : 'h-9 w-9';
  const imgPadding = size === 'small' ? 'p-1' : 'p-1.5';
  const isLight = variant === 'light';

  return (
    <>
      {logoUrl ? (
        <div className={`${iconSize} rounded-lg ${isLight ? 'bg-white/20 backdrop-blur-sm' : 'bg-white border border-gray-200'} overflow-hidden flex items-center justify-center ${isLight ? '' : 'shadow-sm'} shrink-0`}>
          <img
            src={logoUrl}
            alt="Logo"
            className={`h-full w-full object-contain ${isLight ? 'p-1.5 brightness-0 invert' : imgPadding}`}
          />
        </div>
      ) : (
        <div className={`${iconSize} rounded-lg ${isLight ? 'bg-white/20 backdrop-blur-sm' : 'bg-cyan-600'} text-white flex items-center justify-center shrink-0`}>
          <BookOpen className={size === 'small' ? 'h-4 w-4' : 'h-5 w-5'} />
        </div>
      )}
      {size !== 'small' && (
        <div className={cn(isLight ? 'block' : 'hidden sm:block', className)}>
          <h1 className={`text-base font-bold leading-tight ${isLight ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>{primary}</h1>
          <p className={`text-[10px] -mt-0.5 leading-tight ${isLight ? 'text-cyan-100' : 'text-gray-500 dark:text-gray-400'}`}>{secondary || 'Center of Excellence'}</p>
        </div>
      )}
    </>
  );
}
