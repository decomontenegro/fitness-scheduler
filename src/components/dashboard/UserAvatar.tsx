'use client';

import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface UserAvatarProps {
  user?: {
    name: string;
    avatar?: string;
  };
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy';
  className?: string;
  showStatus?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors = {
  online: 'bg-success-500',
  offline: 'bg-gray-400',
  busy: 'bg-warning-500',
};

export function UserAvatar({ 
  user, 
  size = 'md', 
  status, 
  className,
  showStatus = false 
}: UserAvatarProps) {
  const initials = user?.name
    ?.split(' ')
    .map(name => name.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '??';

  return (
    <div className={cn('relative inline-flex', className)}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={cn(
            'rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm',
            sizeClasses[size]
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold border-2 border-white dark:border-gray-800 shadow-sm',
            sizeClasses[size]
          )}
        >
          {user?.name ? initials : <User className="w-1/2 h-1/2" />}
        </div>
      )}
      
      {showStatus && status && (
        <div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800',
            statusColors[status],
            size === 'sm' && 'w-2 h-2',
            size === 'xl' && 'w-4 h-4'
          )}
        />
      )}
    </div>
  );
}