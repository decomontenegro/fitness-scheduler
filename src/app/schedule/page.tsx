'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ScheduleCalendar from '@/components/calendar/ScheduleCalendar';
import TimeSlot from '@/components/calendar/TimeSlot';
import ServiceCard from '@/components/ui/ServiceCard';
import BookingConfirmation from '@/components/ui/BookingConfirmation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  UserIcon, 
  StarIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Trainer {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  specialties?: string;
  experience?: number;
  hourlyRate?: number;
  rating: number;
  totalReviews: number;
  reviewCount: number;
  services: Service[];
}

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  formattedPrice?: string;
  formattedDuration?: string;
}

interface TimeSlotData {
  startTime: string;
  endTime: string;
  display: string;
  available: boolean;
}

interface BookingData {
  trainer: {
    id: string;
    name: string;
    avatar?: string;
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
  date: Date;
  startTime: string;
  endTime: string;
  notes?: string;
}

export default function SchedulePage() {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: Trainer, 2: Service, 3: Date/Time, 4: Confirm
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotData | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlotData[]>([]);
  const [notes, setNotes] = useState('');
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    trainers: false,
    slots: false,
    booking: false,
  });

  // Fetch trainers on component mount
  useEffect(() => {
    fetchTrainers();
  }, []);

  // Fetch available slots when trainer and date are selected
  useEffect(() => {
    if (selectedTrainer && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedTrainer, selectedDate]);

  const fetchTrainers = async () => {
    setLoadingStates(prev => ({ ...prev, trainers: true }));
    try {
      const response = await fetch('/api/trainers');
      const data = await response.json();
      
      if (data.success) {
        setTrainers(data.data);
      } else {
        console.error('Error fetching trainers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, trainers: false }));
    }
  };

  const fetchAvailableSlots = async () => {
    if (!selectedTrainer || !selectedDate) return;

    setLoadingStates(prev => ({ ...prev, slots: true }));
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/trainers/${selectedTrainer.id}/availability?date=${dateString}`
      );
      const data = await response.json();
      
      if (data.success) {
        setAvailableSlots(data.data.availableSlots || []);
      } else {
        console.error('Error fetching availability:', data.error);
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingStates(prev => ({ ...prev, slots: false }));
    }
  };

  const handleTrainerSelect = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setAvailableSlots([]);
    setStep(2);
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setAvailableSlots([]);
    setStep(3);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (slot: TimeSlotData) => {
    setSelectedTimeSlot(slot);
  };

  const handleContinueToConfirmation = () => {
    if (!selectedTrainer || !selectedService || !selectedDate || !selectedTimeSlot) {
      return;
    }

    const booking: BookingData = {
      trainer: {
        id: selectedTrainer.id,
        name: selectedTrainer.name,
        avatar: selectedTrainer.avatar,
      },
      service: {
        id: selectedService.id,
        name: selectedService.name,
        duration: selectedService.duration,
        price: selectedService.price,
      },
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      notes: notes.trim() || undefined,
    };

    setBookingData(booking);
    setShowConfirmation(true);
  };

  const handleConfirmBooking = async () => {
    if (!bookingData || !user) return;

    setLoadingStates(prev => ({ ...prev, booking: true }));
    try {
      // Get user profile
      const profileResponse = await fetch('/api/users/profile', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });
      
      if (!profileResponse.ok) {
        throw new Error('Failed to get user profile');
      }
      
      const profileData = await profileResponse.json();
      
      const appointmentData = {
        trainerId: bookingData.trainer.id,
        clientId: profileData.id, // Use profile ID, not user ID
        serviceId: bookingData.service.id,
        date: bookingData.date.toISOString(),
        startTime: bookingData.startTime,
        endTime: bookingData.endTime,
        notes: bookingData.notes,
        price: bookingData.service.price,
      };

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        // Success - redirect to dashboard or show success message
        setShowConfirmation(false);
        alert('Agendamento confirmado com sucesso!');
        // Reset form
        setStep(1);
        setSelectedTrainer(null);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
        setNotes('');
        setBookingData(null);
      } else {
        const errorData = await response.json();
        alert(`Erro ao confirmar agendamento: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Erro ao confirmar agendamento. Tente novamente.');
    } finally {
      setLoadingStates(prev => ({ ...prev, booking: false }));
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      if (step === 2) {
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedTimeSlot(null);
      } else if (step === 3) {
        setSelectedDate(null);
        setSelectedTimeSlot(null);
      }
    }
  };

  const canContinue = () => {
    switch (step) {
      case 1:
        return selectedTrainer !== null;
      case 2:
        return selectedService !== null;
      case 3:
        return selectedDate !== null && selectedTimeSlot !== null;
      default:
        return false;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Acesso negado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Você precisa estar logado para acessar o agendamento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold gradient-text">
                Novo Agendamento
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {step === 1 && 'Escolha seu personal trainer'}
                {step === 2 && 'Selecione o tipo de serviço'}
                {step === 3 && 'Escolha data e horário'}
              </p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    stepNum <= step
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {stepNum < step ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    stepNum
                  )}
                </div>
                {stepNum < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 transition-all duration-300 ${
                      stepNum < step
                        ? 'bg-primary-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Trainer Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Escolha seu Personal Trainer
            </h2>
            
            {loadingStates.trainers ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((trainer) => (
                  <Card
                    key={trainer.id}
                    className="cursor-pointer hover-lift p-6 transition-all duration-300"
                    onClick={() => handleTrainerSelect(trainer)}
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      {trainer.avatar ? (
                        <img
                          src={trainer.avatar}
                          alt={trainer.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-8 h-8 text-white" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {trainer.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {trainer.rating.toFixed(1)} ({trainer.reviewCount} avaliações)
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
                      <p className="text-sm text-primary-600 dark:text-primary-400 mb-3">
                        <strong>Especialidades:</strong> {trainer.specialties}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {trainer.experience} anos de experiência
                      </span>
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {trainer.services.length} serviços
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Service Selection */}
        {step === 2 && selectedTrainer && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Escolha o Serviço
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Personal Trainer: <span className="font-medium">{selectedTrainer.name}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedTrainer.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  selected={selectedService?.id === service.id}
                  onSelect={handleServiceSelect}
                />
              ))}
            </div>

            {selectedService && (
              <div className="flex justify-end">
                <Button onClick={() => setStep(3)} className="btn-primary">
                  Continuar
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date and Time Selection */}
        {step === 3 && selectedTrainer && selectedService && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Escolha Data e Horário
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                <span className="font-medium">{selectedService.name}</span> com{' '}
                <span className="font-medium">{selectedTrainer.name}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <div>
                <ScheduleCalendar
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  minDate={new Date()}
                />
              </div>

              {/* Time slots */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Horários Disponíveis
                </h3>
                
                {!selectedDate ? (
                  <div className="text-center py-12 text-gray-500">
                    Selecione uma data para ver os horários disponíveis
                  </div>
                ) : loadingStates.slots ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      Nenhum horário disponível para esta data
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {availableSlots.map((slot, index) => (
                      <TimeSlot
                        key={index}
                        startTime={slot.startTime}
                        endTime={slot.endTime}
                        display={slot.display}
                        available={slot.available}
                        selected={selectedTimeSlot?.startTime === slot.startTime}
                        onSelect={() => handleTimeSlotSelect(slot)}
                        price={selectedService.price}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {selectedTimeSlot && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observações (opcional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Adicione observações sobre o treino, objetivos específicos, etc."
                    className="input min-h-[100px] resize-none"
                  />
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={handleContinueToConfirmation}
                    className="btn-primary"
                  >
                    Revisar Agendamento
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <BookingConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        bookingData={bookingData}
        onConfirm={handleConfirmBooking}
        isLoading={loadingStates.booking}
      />
    </div>
  );
}