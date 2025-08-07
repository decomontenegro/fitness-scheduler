'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'glass' | 'modern';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text',
    label,
    error,
    helper,
    icon,
    fullWidth = true,
    variant = 'default',
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    const variants = {
      default: 'input',
      glass: 'input glass-morphism border-0',
      modern: 'input border-2 border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300',
    };

    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {label && (
          <label className={cn(
            "block text-sm font-medium mb-1 transition-all duration-200",
            isFocused 
              ? "text-primary-600 dark:text-primary-400" 
              : "text-gray-700 dark:text-gray-300"
          )}>
            {label}
          </label>
        )}
        
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className={cn(
                "transition-colors duration-200",
                isFocused 
                  ? "text-primary-500" 
                  : "text-gray-400"
              )}>{icon}</span>
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              variants[variant],
              icon && 'pl-10',
              isPassword && 'pr-10',
              error && 'input-error',
              'focus-ring',
              'group-hover:border-primary-300 dark:group-hover:border-primary-600',
              className
            )}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            ref={ref}
            {...props}
          />
          
          {isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              )}
            </button>
          )}
        </div>
        
        {helper && !error && (
          <p className="mt-1 text-sm text-gray-500">{helper}</p>
        )}
        
        {error && (
          <div className="mt-1 flex items-center gap-1 text-sm text-danger-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };