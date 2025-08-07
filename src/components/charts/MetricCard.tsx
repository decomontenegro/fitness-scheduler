'use client'

import { ReactNode } from 'react'
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    isPositive?: boolean
    label?: string
  }
  icon?: ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray'
  className?: string
  onClick?: () => void
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className = '',
  onClick
}: MetricCardProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    green: 'border-green-200 bg-green-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    red: 'border-red-200 bg-red-50',
    gray: 'border-gray-200 bg-gray-50'
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    red: 'text-red-600',
    gray: 'text-gray-600'
  }

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format currency
      if (title.toLowerCase().includes('receita') || title.toLowerCase().includes('valor')) {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(val)
      }
      
      // Format percentage
      if (title.toLowerCase().includes('taxa') || title.toLowerCase().includes('%')) {
        return `${val.toFixed(1)}%`
      }
      
      // Format regular numbers
      return new Intl.NumberFormat('pt-BR').format(val)
    }
    
    return val
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg border-2 p-6 transition-all duration-200
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.02]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500">
              {subtitle}
            </p>
          )}
          
          {trend && (
            <div className="flex items-center mt-2">
              <div className={`flex items-center space-x-1 ${
                trend.isPositive === true 
                  ? 'text-green-600' 
                  : trend.isPositive === false 
                    ? 'text-red-600' 
                    : 'text-gray-600'
              }`}>
                {trend.isPositive === true && (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                )}
                {trend.isPositive === false && (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(trend.value).toFixed(1)}%
                </span>
              </div>
              {trend.label && (
                <span className="text-xs text-gray-500 ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>

        {icon && (
          <div className={`flex-shrink-0 p-2 rounded-full ${iconColorClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Decorative background pattern */}
      <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white bg-opacity-20"></div>
      <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-white bg-opacity-10"></div>
    </div>
  )
}