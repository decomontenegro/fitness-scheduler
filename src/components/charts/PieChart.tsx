'use client'

import { Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieChartProps {
  data: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor?: string[]
      borderColor?: string[]
      borderWidth?: number
    }>
  }
  options?: any
  className?: string
  height?: number
  showLegend?: boolean
  centerText?: {
    value: string
    label: string
  }
}

export function PieChart({ 
  data, 
  options = {}, 
  className = '', 
  height = 400, 
  showLegend = true,
  centerText
}: PieChartProps) {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12,
        callbacks: {
          label: function(context: any) {
            const label = context.label || ''
            const value = context.raw
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          }
        }
      }
    },
    cutout: centerText ? '60%' : '0%',
    elements: {
      arc: {
        borderWidth: 2
      }
    }
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins
    }
  }

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <Doughnut data={data} options={mergedOptions} />
      {centerText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-2xl font-bold text-gray-900">{centerText.value}</div>
          <div className="text-sm text-gray-500">{centerText.label}</div>
        </div>
      )}
    </div>
  )
}