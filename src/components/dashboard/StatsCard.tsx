'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </p>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    trend.isPositive
                      ? 'text-success-700 bg-success-100 dark:text-success-400 dark:bg-success-900/30'
                      : 'text-danger-700 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}