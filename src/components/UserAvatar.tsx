'use client';

import { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { generateAvatarUri } from '@/lib/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  displayName?: string;
  email?: string;
  avatarStyle?: string | null;
  avatarSeed?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-16 w-16',
};

const FALLBACK_TEXT_CLASSES = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
};

function getInitials(displayName?: string, email?: string): string {
  if (displayName) {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.[0]?.toUpperCase() ?? '?';
}

export function UserAvatar({
  displayName,
  email,
  avatarStyle,
  avatarSeed,
  size = 'md',
  className,
}: UserAvatarProps) {
  const dataUri = useMemo(() => {
    if (avatarStyle && avatarSeed) {
      return generateAvatarUri(avatarStyle, avatarSeed);
    }
    return '';
  }, [avatarStyle, avatarSeed]);

  const initials = getInitials(displayName, email);

  return (
    <Avatar className={cn(SIZE_CLASSES[size], 'rounded-full', className)}>
      {dataUri ? (
        <AvatarImage src={dataUri} alt={displayName || 'Avatar'} className="rounded-full" />
      ) : null}
      <AvatarFallback className={cn('rounded-full bg-primary text-primary-foreground font-medium', FALLBACK_TEXT_CLASSES[size])}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
