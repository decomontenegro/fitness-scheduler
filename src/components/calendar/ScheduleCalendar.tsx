'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ScheduleCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  disabledDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
}

export default function ScheduleCalendar({
  selectedDate,
  onDateSelect,
  disabledDates = [],
  minDate = new Date(),
  maxDate,
}: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isDateDisabled = (date: Date) => {
    if (!date) return true;
    
    // Check if date is before minDate
    if (minDate && date < minDate) return true;
    
    // Check if date is after maxDate
    if (maxDate && date > maxDate) return true;
    
    // Check if date is in disabled dates
    return disabledDates.some(disabledDate => 
      date.toDateString() === disabledDate.toDateString()
    );
  };

  const isDateSelected = (date: Date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        
        <h2 className="text-lg font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Week days header */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="h-12" />;
          }

          const disabled = isDateDisabled(date);
          const selected = isDateSelected(date);
          const today = isToday(date);

          return (
            <button
              key={date.toISOString()}
              onClick={() => !disabled && onDateSelect(date)}
              disabled={disabled}
              className={`
                h-12 rounded-lg text-sm font-medium transition-all duration-200
                ${disabled 
                  ? 'text-gray-300 cursor-not-allowed bg-gray-50 dark:bg-gray-800 dark:text-gray-600' 
                  : 'hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
                }
                ${selected 
                  ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-lg' 
                  : 'text-gray-700 dark:text-gray-300'
                }
                ${today && !selected 
                  ? 'ring-2 ring-primary-300 bg-primary-50 dark:bg-primary-900/30' 
                  : ''
                }
                hover-lift focus-ring
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-6 text-xs text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span>Selecionado</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full ring-2 ring-primary-300 bg-primary-50"></div>
          <span>Hoje</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          <span>Indisponível</span>
        </div>
      </div>
    </div>
  );
}