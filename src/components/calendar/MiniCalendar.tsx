'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  highlightedDates?: Date[];
  className?: string;
}

export function MiniCalendar({ 
  selectedDate, 
  onDateSelect, 
  highlightedDates = [],
  className 
}: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekDays = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const isHighlighted = (date: Date) => {
    return highlightedDates.some(d => isSameDay(d, date));
  };

  const isSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  return (
    <Card className={cn('w-full max-w-sm', className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="p-1"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </h3>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="p-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayInMonth = isSameMonth(day, currentMonth);
            const highlighted = isHighlighted(day);
            const selected = isSelected(day);
            const today = isToday(day);

            return (
              <button
                key={index}
                onClick={() => onDateSelect?.(day)}
                className={cn(
                  'aspect-square flex items-center justify-center text-sm rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  !dayInMonth && 'text-gray-300 dark:text-gray-600',
                  dayInMonth && 'text-gray-900 dark:text-white',
                  today && 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold',
                  selected && 'bg-primary-500 text-white hover:bg-primary-600',
                  highlighted && !selected && 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
                  !dayInMonth && 'cursor-not-allowed hover:bg-transparent'
                )}
                disabled={!dayInMonth}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}