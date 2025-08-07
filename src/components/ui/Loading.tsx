'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse';
  fullScreen?: boolean;
}

const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  variant = 'spinner',
  fullScreen = false,
  className,
  ...props 
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const Spinner = () => (
    <div className={cn('spinner', sizes[size])} />
  );

  const Dots = () => (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full bg-primary-500',
            size === 'sm' && 'w-2 h-2',
            size === 'md' && 'w-3 h-3',
            size === 'lg' && 'w-4 h-4',
            size === 'xl' && 'w-5 h-5',
            'animate-pulse'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );

  const Pulse = () => (
    <div className={cn(
      'rounded-full bg-gradient-to-r from-primary-400 to-secondary-400',
      sizes[size],
      'animate-pulse-soft'
    )} />
  );

  const variants = {
    spinner: <Spinner />,
    dots: <Dots />,
    pulse: <Pulse />,
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {variants[variant]}
          <p className="text-sm text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center justify-center', className)} {...props}>
      {variants[variant]}
    </div>
  );
};

Loading.displayName = 'Loading';

export { Loading };