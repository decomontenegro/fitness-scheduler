'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  magnetic?: boolean;
  glow?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    icon,
    fullWidth = false,
    magnetic = false,
    glow = false,
    children, 
    disabled,
    ...props 
  }, ref) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'bg-danger-500 text-white hover:bg-danger-600 focus:ring-danger-500 shadow-lg hover:shadow-xl',
      gradient: 'gradient-shift text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300',
      glass: 'glass-morphism text-gray-900 dark:text-white hover:bg-white/20 dark:hover:bg-gray-900/20 backdrop-blur-xl',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
      xl: 'px-8 py-4 text-xl',
    };

    return (
      <button
        className={cn(
          'btn',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          'inline-flex items-center justify-center gap-2',
          'transition-all duration-200',
          'micro-bounce focus-ring',
          magnetic && 'btn-magnetic',
          glow && 'hover-glow',
          loading && 'cursor-not-allowed opacity-70',
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };