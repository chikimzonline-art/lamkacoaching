'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  user?: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  } | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ user, className, fallbackClassName }: UserAvatarProps) {
  const name = user?.name || 'Student';
  const initial = name.trim().charAt(0).toUpperCase() || 'S';

  return (
    <Avatar className={cn('h-8 w-8 border border-slate-200 shadow-sm shrink-0', className)}>
      {user?.image && (
        <AvatarImage src={user.image} alt={name} className="object-cover" />
      )}
      <AvatarFallback className={cn('bg-primary text-primary-foreground font-semibold text-xs', fallbackClassName)}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
