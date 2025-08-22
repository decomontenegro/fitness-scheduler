'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { format, addDays, startOfWeek, isSameDay, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/Toast';
import { 
  Calendar, Clock, User, Check, ChevronRight, 
  ChevronLeft, Star, Loader2
} from 'lucide-react';

interface Trainer {
  id: string;
  name: string;
  bio?: string;
  specialties?: string;
  rating: number;
  totalReviews: number;
  hourlyRate: number;
  services?: any[];
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  startTime: string;
  endTime: string;
}

export function SimpleBookingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingNotes, setBookingNotes] = useState('');
  const [currentWeek, setCurrentWeek] = useState(new Date());

  useEffect(() => {
    fetchTrainers();
  }, []);

  useEffect(() => {
    if (selectedTrainer && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedTrainer, selectedDate]);

  const fetchTrainers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/trainers');
      const data = await response.json();
      if (data.success && data.trainers) {
        setTrainers(data.trainers);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast.error('Erro ao carregar trainers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedTrainer || !selectedDate) return;
    
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(
        `/api/trainers/${selectedTrainer.id}/availability/slots?date=${dateStr}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.error('Erro ao carregar horários');
    } finally {
      setLoading(false);
    }
  };

  const handleBookingConfirm = async () => {
    if (!selectedTrainer || !selectedDate || !selectedSlot) {
      toast.error('Por favor, selecione todos os campos necessários');
      return;
    }

    setLoading(true);
    try {
      const service = selectedTrainer.services?.[0];
      if (!service) {
        toast.error('Nenhum serviço disponível para este trainer');
        return;
      }

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: selectedTrainer.id,
          serviceId: service.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          timeSlot: selectedSlot.time,
          notes: bookingNotes,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Agendamento realizado com sucesso!');
        // Reset form
        setCurrentStep(1);
        setSelectedTrainer(null);
        setSelectedDate(null);
        setSelectedSlot(null);
        setBookingNotes('');
        
        setTimeout(() => {
          window.location.href = '/appointments';
        }, 2000);
      } else {
        toast.error(data.error || 'Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Erro ao processar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const generateWeekDays = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const isToday = isSameDay(date, new Date());
      const isPast = isBefore(date, new Date()) && !isToday;
      
      days.push({
        date,
        dayName: format(date, 'EEE', { locale: ptBR }),
        dayNumber: format(date, 'd'),
        isToday,
        isPast,
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      });
    }
    
    return days;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { number: 1, title: 'Escolher Trainer', icon: <User className="w-5 h-5" /> },
            { number: 2, title: 'Selecionar Data', icon: <Calendar className="w-5 h-5" /> },
            { number: 3, title: 'Escolher Horário', icon: <Clock className="w-5 h-5" /> },
            { number: 4, title: 'Confirmar', icon: <Check className="w-5 h-5" /> },
          ].map((step, index, array) => (
            <React.Fragment key={step.number}>
              <button
                onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                className={`flex flex-col items-center cursor-pointer ${
                  currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
                }`}
                disabled={step.number > currentStep}
              >
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center mb-2
                  ${currentStep >= step.number 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {currentStep > step.number ? <Check className="w-5 h-5" /> : step.icon}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </button>
              
              {index < array.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  currentStep > step.number ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
        {/* Step 1: Select Trainer */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Escolha seu Trainer</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : trainers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Nenhum trainer disponível</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map(trainer => (
                  <div
                    key={trainer.id}
                    onClick={() => {
                      setSelectedTrainer(trainer);
                      setCurrentStep(2);
                    }}
                    className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-md cursor-pointer border-2 border-transparent hover:border-primary-500 transition-all"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold text-xl">
                        {trainer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{trainer.name}</h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{trainer.rating.toFixed(1)}</span>
                          <span className="text-sm text-gray-500">
                            ({trainer.totalReviews} avaliações)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {trainer.bio && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {trainer.bio}
                      </p>
                    )}
                    
                    {trainer.specialties && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {trainer.specialties.split(',').slice(0, 3).map((specialty, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-xs"
                          >
                            {specialty.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Por sessão</span>
                      <span className="text-xl font-bold text-primary-600">
                        R$ {trainer.hourlyRate.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Date */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Escolha a Data</h2>
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            </div>

            {selectedTrainer && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  Agendando com <strong>{selectedTrainer.name}</strong>
                </p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentWeek(prev => addDays(prev, -7))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <h3 className="text-lg font-semibold">
                  {format(startOfWeek(currentWeek), "MMMM 'de' yyyy", { locale: ptBR })}
                </h3>
                
                <button
                  onClick={() => setCurrentWeek(prev => addDays(prev, 7))}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {generateWeekDays().map(day => (
                  <button
                    key={day.date.toISOString()}
                    onClick={() => !day.isPast && setSelectedDate(day.date) && setCurrentStep(3)}
                    disabled={day.isPast}
                    className={`
                      p-4 rounded-xl transition-all
                      ${day.isSelected 
                        ? 'bg-primary-600 text-white' 
                        : day.isToday
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : day.isPast
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                      }
                    `}
                  >
                    <div className="text-xs font-medium mb-1">{day.dayName}</div>
                    <div className="text-xl font-bold">{day.dayNumber}</div>
                    {day.isToday && <div className="text-xs mt-1">Hoje</div>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Select Time */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Escolha o Horário</h2>
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            </div>

            {selectedTrainer && selectedDate && (
              <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-primary-700 dark:text-primary-300">
                  <strong>{selectedTrainer.name}</strong> • {' '}
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Sem horários disponíveis para esta data</p>
                <Button
                  onClick={() => setCurrentStep(2)}
                  className="mt-4"
                  variant="primary"
                >
                  Escolher Outra Data
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {availableSlots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => {
                      setSelectedSlot(slot);
                      setCurrentStep(4);
                    }}
                    disabled={!slot.available}
                    className={`
                      p-4 rounded-xl font-medium transition-all
                      ${!slot.available
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                        : selectedSlot?.id === slot.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500'
                      }
                    `}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-2" />
                    <div className="text-lg">{slot.time}</div>
                    <div className="text-xs mt-1">
                      {slot.available ? 'Disponível' : 'Ocupado'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Confirm */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Confirmar Agendamento</h2>
              <Button
                onClick={() => setCurrentStep(3)}
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Resumo do Agendamento</h3>
              
              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Trainer</p>
                  <p className="font-medium">{selectedTrainer?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Data</p>
                  <p className="font-medium">
                    {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Horário</p>
                  <p className="font-medium">{selectedSlot?.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Valor</p>
                  <p className="font-medium text-xl text-primary-600">
                    R$ {selectedTrainer?.hourlyRate.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Observações (opcional)</label>
              <textarea
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                placeholder="Alguma informação adicional para o trainer..."
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none"
                rows={3}
              />
            </div>

            <Button
              onClick={handleBookingConfirm}
              loading={loading}
              variant="primary"
              fullWidth
              size="lg"
            >
              Confirmar Agendamento
            </Button>

            <p className="text-xs text-center text-gray-500">
              Ao confirmar, você concorda com os termos de agendamento. 
              Cancelamentos devem ser feitos com 24h de antecedência.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}