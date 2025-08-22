'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={{
        width: width || '100%',
        height: height || (variant === 'text' ? '1rem' : '100%'),
      }}
    />
  );
}

// Card Skeleton
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="40%" height="1.5rem" />
          <Skeleton variant="circular" width="2rem" height="2rem" />
        </div>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="75%" />
        <div className="flex gap-2 mt-4">
          <Skeleton variant="rounded" width="80px" height="32px" />
          <Skeleton variant="rounded" width="80px" height="32px" />
        </div>
      </div>
    </div>
  );
}

// Table Row Skeleton
export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-700">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton variant="text" />
        </td>
      ))}
    </tr>
  );
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
      <Skeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="30%" />
        <Skeleton variant="text" width="60%" />
      </div>
      <Skeleton variant="rounded" width="80px" height="32px" />
    </div>
  );
}

// Dashboard Stats Skeleton
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Skeleton variant="circular" width="40px" height="40px" />
            <Skeleton variant="text" width="20%" />
          </div>
          <Skeleton variant="text" width="50%" height="2rem" className="mb-2" />
          <Skeleton variant="text" width="70%" />
        </div>
      ))}
    </div>
  );
}

// Calendar Skeleton
export function CalendarSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton variant="text" width="150px" height="1.5rem" />
        <div className="flex gap-2">
          <Skeleton variant="rounded" width="80px" height="32px" />
          <Skeleton variant="rounded" width="80px" height="32px" />
        </div>
      </div>
      
      {/* Week Days */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" height="1rem" />
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height="80px" />
        ))}
      </div>
    </div>
  );
}

// Form Skeleton
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width="30%" height="0.875rem" />
          <Skeleton variant="rounded" height="40px" />
        </div>
      ))}
      <div className="flex gap-4 mt-6">
        <Skeleton variant="rounded" width="120px" height="40px" />
        <Skeleton variant="rounded" width="120px" height="40px" />
      </div>
    </div>
  );
}

// Add shimmer animation to tailwind
export const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  .animate-shimmer {
    background: linear-gradient(
      90deg,
      rgba(156, 163, 175, 0.1) 0%,
      rgba(156, 163, 175, 0.3) 50%,
      rgba(156, 163, 175, 0.1) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s ease-in-out infinite;
  }
`;

// Export additional skeleton loaders
export * from './SkeletonLoaders';