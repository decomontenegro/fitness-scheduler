'use client'

import { useMemo } from 'react'

interface HeatmapData {
  day: number
  hour: number
  value: number
  dayName: string
  timeLabel: string
}

interface HeatmapChartProps {
  data: HeatmapData[]
  className?: string
  height?: number
}

export function HeatmapChart({ data, className = '', height = 300 }: HeatmapChartProps) {
  const { processedData, maxValue } = useMemo(() => {
    const max = Math.max(...data.map(d => d.value))
    
    // Group data by day and hour
    const grid: { [key: string]: number } = {}
    data.forEach(item => {
      const key = `${item.day}-${item.hour}`
      grid[key] = item.value
    })

    return {
      processedData: grid,
      maxValue: max
    }
  }, [data])

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const hours = Array.from({ length: 17 }, (_, i) => i + 6) // 6AM to 10PM

  const getIntensity = (value: number) => {
    if (maxValue === 0) return 0
    return value / maxValue
  }

  const getColor = (intensity: number) => {
    const alpha = Math.max(0.1, intensity)
    return `rgba(59, 130, 246, ${alpha})` // Blue with varying opacity
  }

  return (
    <div className={`relative ${className}`} style={{ height: `${height}px` }}>
      <div className="w-full h-full overflow-auto">
        <div className="min-w-[800px] h-full">
          {/* Header with hours */}
          <div className="flex">
            <div className="w-12"></div> {/* Space for day labels */}
            {hours.map(hour => (
              <div key={hour} className="flex-1 text-xs text-gray-500 text-center py-2">
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col">
            {days.map((dayName, dayIndex) => (
              <div key={dayIndex} className="flex items-center">
                <div className="w-12 text-xs text-gray-500 text-right pr-2">
                  {dayName}
                </div>
                {hours.map(hour => {
                  const key = `${dayIndex}-${hour}`
                  const value = processedData[key] || 0
                  const intensity = getIntensity(value)
                  const color = getColor(intensity)

                  return (
                    <div
                      key={hour}
                      className="flex-1 aspect-square border border-gray-200 flex items-center justify-center relative group cursor-pointer"
                      style={{ backgroundColor: color }}
                    >
                      {value > 0 && (
                        <span className="text-xs font-medium text-white drop-shadow-sm">
                          {value}
                        </span>
                      )}
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {dayName} {hour.toString().padStart(2, '0')}:00 - {value} agendamentos
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-4">
            <span className="text-xs text-gray-500">Menos</span>
            <div className="flex space-x-1">
              {[0.1, 0.3, 0.5, 0.7, 1].map(intensity => (
                <div
                  key={intensity}
                  className="w-3 h-3 border border-gray-200"
                  style={{ backgroundColor: getColor(intensity) }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">Mais</span>
          </div>
        </div>
      </div>
    </div>
  )
}