'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  CurrencyDollarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

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

interface BookingConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  bookingData: BookingData | null;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function BookingConfirmation({
  isOpen,
  onClose,
  bookingData,
  onConfirm,
  isLoading = false,
}: BookingConfirmationProps) {
  if (!bookingData) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all glass-morphism">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100 flex items-center space-x-2"
                  >
                    <CheckCircleIcon className="w-6 h-6 text-primary-500" />
                    <span>Confirmar Agendamento</span>
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Booking Details */}
                <div className="space-y-4 mb-6">
                  {/* Trainer */}
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {bookingData.trainer.avatar ? (
                        <img
                          src={bookingData.trainer.avatar}
                          alt={bookingData.trainer.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                          <UserIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Personal Trainer</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {bookingData.trainer.name}
                      </p>
                    </div>
                  </div>

                  {/* Service */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Serviço</p>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {bookingData.service.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDuration(bookingData.service.duration)}</span>
                      </div>
                      <div className="flex items-center space-x-1 font-semibold text-primary-600 dark:text-primary-400">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        <span>{formatPrice(bookingData.service.price)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Data</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {formatDate(bookingData.date)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>Horário</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                        {formatTime(bookingData.startTime)} - {formatTime(bookingData.endTime)}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {bookingData.notes && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Observações</p>
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {bookingData.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="flex items-start space-x-3 p-4 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg mb-6">
                  <ExclamationTriangleIcon className="w-5 h-5 text-warning-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-warning-800 dark:text-warning-200 font-medium mb-1">
                      Atenção
                    </p>
                    <p className="text-warning-700 dark:text-warning-300">
                      Após confirmar, você receberá um e-mail com os detalhes do agendamento.
                      Lembre-se de chegar com 10 minutos de antecedência.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 btn-outline hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 btn-primary relative overflow-hidden"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Confirmando...</span>
                      </div>
                    ) : (
                      'Confirmar Agendamento'
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}