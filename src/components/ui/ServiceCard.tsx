'use client';

import { ClockIcon, CurrencyDollarIcon, CheckIcon } from '@heroicons/react/24/outline';

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  formattedPrice?: string;
  formattedDuration?: string;
}

interface ServiceCardProps {
  service: Service;
  selected?: boolean;
  onSelect?: (service: Service) => void;
  disabled?: boolean;
}

export default function ServiceCard({
  service,
  selected = false,
  onSelect,
  disabled = false,
}: ServiceCardProps) {
  const handleClick = () => {
    if (!disabled && onSelect) {
      onSelect(service);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative w-full p-6 rounded-xl border-2 text-left transition-all duration-300 group
        focus:outline-none focus:ring-4 focus:ring-primary-500/30
        ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
            : selected
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg hover:shadow-xl'
            : 'border-gray-200 bg-white dark:bg-gray-800 hover:border-primary-300 hover:shadow-md'
        }
        hover-lift card-tilt
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className={`text-lg font-semibold ${
          selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
        }`}>
          {service.name}
        </h3>
        
        {/* Selection indicator */}
        {selected && (
          <div className="bg-primary-500 text-white rounded-full p-1.5 animate-fade-in">
            <CheckIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Description */}
      {service.description && (
        <p className={`text-sm mb-4 ${
          selected ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'
        }`}>
          {service.description}
        </p>
      )}

      {/* Service details */}
      <div className="flex items-center justify-between">
        {/* Duration */}
        <div className="flex items-center space-x-2">
          <ClockIcon className={`w-5 h-5 ${
            selected ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <span className={`text-sm font-medium ${
            selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'
          }`}>
            {service.formattedDuration || formatDuration(service.duration)}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center space-x-2">
          <CurrencyDollarIcon className={`w-5 h-5 ${
            selected ? 'text-primary-500' : 'text-gray-400'
          }`} />
          <span className={`text-lg font-bold ${
            selected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-gray-100'
          }`}>
            {service.formattedPrice || formatPrice(service.price)}
          </span>
        </div>
      </div>

      {/* Hover gradient effect */}
      {!disabled && !selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-secondary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:via-secondary-500/3 group-hover:to-primary-500/5 rounded-xl transition-all duration-500" />
      )}

      {/* Selection background effect */}
      {selected && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-secondary-500/5 to-primary-500/10 rounded-xl animate-pulse opacity-75" />
      )}

      {/* Shine effect on hover */}
      {!disabled && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
      )}
    </button>
  );
}