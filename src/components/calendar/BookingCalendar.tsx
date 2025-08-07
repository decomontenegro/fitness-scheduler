'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
  addHours,
  isAfter,
  isBefore
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  client?: {
    user: {
      name: string;
      avatar?: string;
    };
  };
  trainer?: {
    user: {
      name: string;
      avatar?: string;
    };
  };
}

interface BookingCalendarProps {
  trainerId?: string;
  appointments?: Appointment[];
  onSlotClick?: (slot: TimeSlot) => void;
  onAppointmentClick?: (appointment: Appointment) => void;
  userRole?: 'CLIENT' | 'TRAINER';
  className?: string;
}

export function BookingCalendar({ 
  trainerId,
  appointments = [],
  onSlotClick,
  onAppointmentClick,
  userRole = 'CLIENT',
  className 
}: BookingCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const fetchAvailability = async () => {
    if (!trainerId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/availability?trainerId=${trainerId}&date=${format(weekStart, 'yyyy-MM-dd')}&days=7`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Erro ao carregar disponibilidade:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [trainerId, currentWeek]);

  const previousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const getSlotForDateTime = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = time + ':00';
    
    return availableSlots.find(slot => 
      slot.date === dateStr && 
      format(parseISO(slot.startTime), 'HH:mm:ss') === timeStr
    );
  };

  const getAppointmentForDateTime = (date: Date, time: string) => {
    const targetDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    targetDateTime.setHours(hours, minutes, 0, 0);

    return appointments.find(appointment => {
      const appointmentStart = parseISO(appointment.startTime);
      const appointmentEnd = parseISO(appointment.endTime);
      
      return (
        isAfter(targetDateTime, appointmentStart) || isSameDay(targetDateTime, appointmentStart)
      ) && isBefore(targetDateTime, appointmentEnd);
    });
  };

  const isSlotInPast = (date: Date, time: string) => {
    const slotDateTime = new Date(date);
    const [hours, minutes] = time.split(':').map(Number);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    return isBefore(slotDateTime, new Date());
  };

  const handleSlotClick = (date: Date, time: string) => {
    if (isSlotInPast(date, time)) return;

    const slot = getSlotForDateTime(date, time);
    const appointment = getAppointmentForDateTime(date, time);

    if (appointment) {
      onAppointmentClick?.(appointment);
    } else if (slot && onSlotClick) {
      onSlotClick(slot);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={previousWeek}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {format(weekStart, 'dd MMM', { locale: ptBR })} - {format(weekEnd, 'dd MMM yyyy', { locale: ptBR })}
          </h3>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextWeek}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Carregando agenda...</p>
          </div>
        )}

        {!loading && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-8 gap-1 min-w-[800px]">
              {/* Time column header */}
              <div className="p-2 font-medium text-center text-gray-600 dark:text-gray-400">
                Horário
              </div>
              
              {/* Day headers */}
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="p-2 text-center">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(day, 'EEE', { locale: ptBR })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {format(day, 'dd/MM')}
                  </div>
                </div>
              ))}

              {/* Time slots */}
              {timeSlots.map((time) => (
                <React.Fragment key={time}>
                  {/* Time label */}
                  <div className="p-2 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                    {time}
                  </div>
                  
                  {/* Day slots */}
                  {weekDays.map((day) => {
                    const slot = getSlotForDateTime(day, time);
                    const appointment = getAppointmentForDateTime(day, time);
                    const isPast = isSlotInPast(day, time);
                    
                    return (
                      <div
                        key={`${day.toISOString()}-${time}`}
                        className={cn(
                          'p-1 h-16 border border-gray-200 dark:border-gray-700 cursor-pointer transition-colors',
                          'hover:bg-gray-50 dark:hover:bg-gray-800',
                          isPast && 'opacity-50 cursor-not-allowed',
                          appointment && 'bg-primary-100 dark:bg-primary-900/30 border-primary-300',
                          slot?.available && !appointment && 'bg-success-100 dark:bg-success-900/30 border-success-300',
                          !slot?.available && !appointment && 'bg-gray-100 dark:bg-gray-800'
                        )}
                        onClick={() => !isPast && handleSlotClick(day, time)}
                      >
                        {appointment ? (
                          <div className="h-full flex flex-col justify-center items-center text-xs">
                            <User className="h-3 w-3 mb-1" />
                            <span className="truncate w-full text-center">
                              {userRole === 'TRAINER' 
                                ? appointment.client?.user.name 
                                : appointment.trainer?.user.name
                              }
                            </span>
                          </div>
                        ) : slot?.available ? (
                          <div className="h-full flex items-center justify-center">
                            <Clock className="h-4 w-4 text-success-600" />
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center">
                            <span className="text-xs text-gray-400">--</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success-100 border border-success-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary-100 border border-primary-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Indisponível</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}