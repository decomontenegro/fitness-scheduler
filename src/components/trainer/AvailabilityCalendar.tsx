'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2,
  Copy,
  ChevronLeft,
  ChevronRight,
  Settings,
  Save,
  X,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/Toast';

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  isRecurring?: boolean;
  maxBookings?: number;
}

interface DayAvailability {
  date: string;
  dayOfWeek: string;
  slots: TimeSlot[];
  isBlocked?: boolean;
}

interface AvailabilityCalendarProps {
  trainerId: string;
  onSave?: (availability: DayAvailability[]) => Promise<void>;
}

export function AvailabilityCalendar({ trainerId, onSave }: AvailabilityCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [selectedDay, setSelectedDay] = useState<DayAvailability | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Default time slots
  const defaultSlots: TimeSlot[] = [
    { startTime: '08:00', endTime: '09:00', maxBookings: 1 },
    { startTime: '09:00', endTime: '10:00', maxBookings: 1 },
    { startTime: '10:00', endTime: '11:00', maxBookings: 1 },
    { startTime: '11:00', endTime: '12:00', maxBookings: 1 },
    { startTime: '14:00', endTime: '15:00', maxBookings: 1 },
    { startTime: '15:00', endTime: '16:00', maxBookings: 1 },
    { startTime: '16:00', endTime: '17:00', maxBookings: 1 },
    { startTime: '17:00', endTime: '18:00', maxBookings: 1 },
  ];

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    fetchAvailability();
  }, [currentWeek]);

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trainers/${trainerId}/availability/calendar`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability || generateWeekAvailability());
      } else {
        // Generate default week availability
        setAvailability(generateWeekAvailability());
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability(generateWeekAvailability());
    } finally {
      setLoading(false);
    }
  };

  const generateWeekAvailability = (): DayAvailability[] => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days: DayAvailability[] = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      days.push({
        date: format(date, 'yyyy-MM-dd'),
        dayOfWeek: weekDays[i],
        slots: i > 0 && i < 6 ? [...defaultSlots] : [], // Weekdays only by default
        isBlocked: false,
      });
    }

    return days;
  };

  const handleDayClick = (day: DayAvailability) => {
    setSelectedDay(day);
    setEditingSlot(null);
  };

  const addSlot = () => {
    if (!selectedDay) return;

    const newSlot: TimeSlot = {
      startTime: '09:00',
      endTime: '10:00',
      maxBookings: 1,
    };

    const updatedDay = {
      ...selectedDay,
      slots: [...selectedDay.slots, newSlot],
    };

    updateDayAvailability(updatedDay);
    setEditingSlot(newSlot);
  };

  const updateSlot = (index: number, updates: Partial<TimeSlot>) => {
    if (!selectedDay) return;

    const updatedSlots = [...selectedDay.slots];
    updatedSlots[index] = { ...updatedSlots[index], ...updates };

    const updatedDay = {
      ...selectedDay,
      slots: updatedSlots,
    };

    updateDayAvailability(updatedDay);
  };

  const deleteSlot = (index: number) => {
    if (!selectedDay) return;

    const updatedSlots = selectedDay.slots.filter((_, i) => i !== index);
    const updatedDay = {
      ...selectedDay,
      slots: updatedSlots,
    };

    updateDayAvailability(updatedDay);
  };

  const updateDayAvailability = (updatedDay: DayAvailability) => {
    const updatedAvailability = availability.map(day =>
      day.date === updatedDay.date ? updatedDay : day
    );
    setAvailability(updatedAvailability);
    setSelectedDay(updatedDay);
  };

  const toggleDayBlocked = () => {
    if (!selectedDay) return;

    const updatedDay = {
      ...selectedDay,
      isBlocked: !selectedDay.isBlocked,
      slots: selectedDay.isBlocked ? selectedDay.slots : [],
    };

    updateDayAvailability(updatedDay);
  };

  const copyToWeek = () => {
    if (!selectedDay) return;

    const updatedAvailability = availability.map(day => {
      // Skip weekends or keep current day unchanged
      if (day.date === selectedDay.date || day.dayOfWeek === 'Dom' || day.dayOfWeek === 'Sáb') {
        return day;
      }
      
      return {
        ...day,
        slots: [...selectedDay.slots],
        isBlocked: selectedDay.isBlocked,
      };
    });

    setAvailability(updatedAvailability);
    toast.success('Horários copiados para todos os dias úteis da semana');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) {
        await onSave(availability);
      } else {
        // Default save implementation
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/trainers/${trainerId}/availability/calendar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ availability }),
        });

        if (!response.ok) throw new Error('Failed to save');
      }

      toast.success('Disponibilidade salva com sucesso!');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Erro ao salvar disponibilidade');
    } finally {
      setSaving(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">
                Calendário de Disponibilidade
              </h2>
              <p className="text-white/80 text-sm">
                Configure seus horários de atendimento
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="glass"
              size="sm"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              variant="white"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* Calendar View */}
        <div className="flex-1 p-6">
          {/* Week Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h3 className="text-lg font-semibold">
              {format(startOfWeek(currentWeek), "d 'de' MMMM", { locale: ptBR })} - 
              {format(addDays(startOfWeek(currentWeek), 6), " d 'de' MMMM", { locale: ptBR })}
            </h3>
            
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-7 gap-2">
            {availability.map((day, index) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleDayClick(day)}
                className={`
                  border rounded-xl p-3 cursor-pointer transition-all
                  ${selectedDay?.date === day.date 
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                  }
                  ${day.isBlocked ? 'bg-gray-100 dark:bg-gray-800' : ''}
                `}
              >
                <div className="text-center mb-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {day.dayOfWeek}
                  </p>
                  <p className="font-semibold">
                    {format(parseISO(day.date), 'd')}
                  </p>
                </div>
                
                {day.isBlocked ? (
                  <div className="text-center">
                    <X className="w-4 h-4 text-red-500 mx-auto" />
                    <p className="text-xs text-red-500 mt-1">Bloqueado</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {day.slots.length} slots
                    </p>
                    {day.slots.slice(0, 3).map((slot, i) => (
                      <div
                        key={i}
                        className="text-xs bg-primary-100 dark:bg-primary-900/40 rounded px-1 py-0.5"
                      >
                        {slot.startTime}
                      </div>
                    ))}
                    {day.slots.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{day.slots.length - 3} mais
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Day Details Panel */}
        {selectedDay && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="w-96 border-l border-gray-200 dark:border-gray-700 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">
                  {format(parseISO(selectedDay.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDay.slots.length} horários configurados
                </p>
              </div>
              
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day Actions */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={toggleDayBlocked}
                variant={selectedDay.isBlocked ? 'danger' : 'outline'}
                size="sm"
                fullWidth
              >
                {selectedDay.isBlocked ? 'Desbloquear Dia' : 'Bloquear Dia'}
              </Button>
              
              <Button
                onClick={copyToWeek}
                variant="outline"
                size="sm"
                fullWidth
              >
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </Button>
            </div>

            {!selectedDay.isBlocked && (
              <>
                {/* Time Slots */}
                <div className="space-y-2 mb-4">
                  {selectedDay.slots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Nenhum horário configurado</p>
                    </div>
                  ) : (
                    selectedDay.slots.map((slot, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <Clock className="w-4 h-4 text-gray-500" />
                        
                        {editingSlot === slot ? (
                          <>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) => updateSlot(index, { startTime: e.target.value })}
                              className="input input-sm"
                            />
                            <span>-</span>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) => updateSlot(index, { endTime: e.target.value })}
                              className="input input-sm"
                            />
                            <input
                              type="number"
                              value={slot.maxBookings || 1}
                              onChange={(e) => updateSlot(index, { maxBookings: parseInt(e.target.value) })}
                              className="input input-sm w-16"
                              min="1"
                              max="10"
                            />
                            <button
                              onClick={() => setEditingSlot(null)}
                              className="p-1 text-green-600"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="text-xs bg-primary-100 dark:bg-primary-900 px-2 py-1 rounded">
                              {slot.maxBookings || 1} vaga{(slot.maxBookings || 1) > 1 ? 's' : ''}
                            </span>
                            <button
                              onClick={() => setEditingSlot(slot)}
                              className="p-1 text-primary-600"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSlot(index)}
                              className="p-1 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Add Slot Button */}
                <Button
                  onClick={addSlot}
                  variant="primary"
                  fullWidth
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Horário
                </Button>
              </>
            )}
          </motion.div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowSettings(false)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold mb-4">Configurações Rápidas</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Duração padrão do atendimento
                </label>
                <select className="input w-full">
                  <option>30 minutos</option>
                  <option>45 minutos</option>
                  <option>60 minutos</option>
                  <option>90 minutos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Intervalo entre atendimentos
                </label>
                <select className="input w-full">
                  <option>Sem intervalo</option>
                  <option>15 minutos</option>
                  <option>30 minutos</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Antecedência mínima para agendamento
                </label>
                <select className="input w-full">
                  <option>1 hora</option>
                  <option>2 horas</option>
                  <option>1 dia</option>
                  <option>2 dias</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                fullWidth
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  toast.success('Configurações salvas');
                  setShowSettings(false);
                }}
                variant="primary"
                fullWidth
              >
                Aplicar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}