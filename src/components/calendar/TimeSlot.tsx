'use client';

import { ClockIcon, CheckIcon } from '@heroicons/react/24/outline';

interface TimeSlotProps {
  startTime: string;
  endTime: string;
  display: string;
  available: boolean;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  price?: number;
}

export default function TimeSlot({
  startTime,
  endTime,
  display,
  available,
  selected = false,
  onSelect,
  disabled = false,
  price,
}: TimeSlotProps) {
  const formatTime = (timeString: string) => {
    // If timeString is already in HH:MM format, return it
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString;
    }
    // Otherwise try to parse as date
    const date = new Date(timeString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    // Fallback to original string
    return timeString;
  };

  const isPast = () => {
    // Can't determine if past without full date, so return false
    return false;
  };

  const isDisabled = disabled || !available || isPast();

  const handleClick = () => {
    if (!isDisabled && onSelect) {
      onSelect();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-300 group
        focus:outline-none focus:ring-4 focus:ring-primary-500/30
        ${
          isDisabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : selected
            ? 'border-primary-500 bg-primary-500 text-white shadow-lg hover:shadow-xl'
            : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50 text-gray-700 hover:shadow-md'
        }
        hover-lift
      `}
    >
      {/* Time display */}
      <div className="flex items-center justify-center space-x-2">
        <ClockIcon 
          className={`w-4 h-4 ${
            selected ? 'text-white' : isDisabled ? 'text-gray-400' : 'text-primary-500'
          }`} 
        />
        <span className="font-medium text-sm">
          {display || `${formatTime(startTime)} - ${formatTime(endTime)}`}
        </span>
      </div>

      {/* Price display */}
      {price && (
        <div className={`mt-2 text-xs ${
          selected ? 'text-primary-100' : isDisabled ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(price)}
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute top-2 right-2">
        {selected && (
          <div className="bg-white/20 rounded-full p-1">
            <CheckIcon className="w-4 h-4 text-white" />
          </div>
        )}
        {!available && !selected && (
          <div className="bg-red-100 text-red-600 rounded-full p-1 text-xs">
            ×
          </div>
        )}
      </div>

      {/* Hover effect */}
      {!isDisabled && !selected && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/10 group-hover:to-secondary-500/10 rounded-xl transition-all duration-300" />
      )}

      {/* Selection animation */}
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl animate-pulse opacity-75" />
      )}
    </button>
  );
}