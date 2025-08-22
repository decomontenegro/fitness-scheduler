'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
  Download,
  Eye,
  Trash2,
  Edit,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format, parseISO, isAfter, isBefore, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/Toast';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  price: number;
  notes?: string;
  trainer?: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  client?: {
    id: string;
    name: string;
    avatar?: string;
    phone?: string;
  };
  service?: {
    name: string;
    duration: number;
  };
}

interface AppointmentManagerProps {
  userRole: 'CLIENT' | 'TRAINER';
  userId: string;
}

export function AppointmentManager({ userRole, userId }: AppointmentManagerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    const now = new Date();
    let filtered = [...appointments];

    switch (filter) {
      case 'upcoming':
        filtered = appointments.filter(apt => 
          isAfter(parseISO(apt.startTime), now) && 
          apt.status !== 'CANCELLED'
        );
        break;
      case 'past':
        filtered = appointments.filter(apt => 
          isBefore(parseISO(apt.startTime), now) && 
          apt.status !== 'CANCELLED'
        );
        break;
      case 'cancelled':
        filtered = appointments.filter(apt => apt.status === 'CANCELLED');
        break;
      // 'all' returns all appointments
    }

    setFilteredAppointments(filtered);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    setCancelling(true);
    try {
      const response = await fetch(`/api/appointments/${selectedAppointment.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (response.ok) {
        toast.success('Agendamento cancelado com sucesso');
        setShowCancelModal(false);
        setSelectedAppointment(null);
        setCancelReason('');
        fetchAppointments(); // Refresh list
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao cancelar agendamento');
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Erro ao cancelar agendamento');
    } finally {
      setCancelling(false);
    }
  };

  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        toast.success('Agendamento confirmado!');
        fetchAppointments();
      } else {
        toast.error('Erro ao confirmar agendamento');
      }
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Erro ao confirmar agendamento');
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    // Can cancel if more than 24 hours before appointment
    const appointmentTime = parseISO(appointment.startTime);
    const hoursUntilAppointment = (appointmentTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    return hoursUntilAppointment > 24 && appointment.status !== 'CANCELLED';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmado';
      case 'PENDING':
        return 'Pendente';
      case 'CANCELLED':
        return 'Cancelado';
      case 'COMPLETED':
        return 'Concluído';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['upcoming', 'past', 'cancelled', 'all'] as const).map((filterOption) => (
          <button
            key={filterOption}
            onClick={() => setFilter(filterOption)}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all
              ${filter === filterOption
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }
            `}
          >
            {filterOption === 'upcoming' && 'Próximos'}
            {filterOption === 'past' && 'Passados'}
            {filterOption === 'cancelled' && 'Cancelados'}
            {filterOption === 'all' && 'Todos'}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'upcoming' && 'Você não tem agendamentos futuros'}
            {filter === 'past' && 'Você não tem agendamentos passados'}
            {filter === 'cancelled' && 'Você não tem agendamentos cancelados'}
            {filter === 'all' && 'Você ainda não fez nenhum agendamento'}
          </p>
          {filter === 'upcoming' && (
            <Button
              onClick={() => window.location.href = '/booking'}
              variant="primary"
            >
              Agendar Sessão
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-bold">
                      {userRole === 'CLIENT' 
                        ? appointment.trainer?.name?.charAt(0).toUpperCase()
                        : appointment.client?.name?.charAt(0).toUpperCase()
                      }
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {userRole === 'CLIENT' 
                          ? appointment.trainer?.name
                          : appointment.client?.name
                        }
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(parseISO(appointment.date), "d 'de' MMMM", { locale: ptBR })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(parseISO(appointment.startTime), 'HH:mm')} - 
                          {format(parseISO(appointment.endTime), 'HH:mm')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {appointment.service && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Serviço: {appointment.service.name} ({appointment.service.duration} min)
                      </span>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Observações:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${getStatusColor(appointment.status)}
                    `}>
                      {getStatusLabel(appointment.status)}
                    </span>

                    <span className="text-lg font-bold text-primary-600">
                      R$ {appointment.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {appointment.status === 'PENDING' && userRole === 'TRAINER' && (
                    <Button
                      onClick={() => handleConfirmAppointment(appointment.id)}
                      size="sm"
                      variant="primary"
                      icon={<Check className="w-4 h-4" />}
                    >
                      Confirmar
                    </Button>
                  )}

                  {canCancelAppointment(appointment) && (
                    <Button
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowCancelModal(true);
                      }}
                      size="sm"
                      variant="danger"
                      icon={<X className="w-4 h-4" />}
                    >
                      Cancelar
                    </Button>
                  )}

                  <Button
                    onClick={() => setSelectedAppointment(appointment)}
                    size="sm"
                    variant="outline"
                    icon={<Eye className="w-4 h-4" />}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Cancelar Agendamento</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Motivo do cancelamento
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Explique o motivo do cancelamento..."
                  className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowCancelModal(false)}
                  variant="outline"
                  fullWidth
                >
                  Manter Agendamento
                </Button>
                <Button
                  onClick={handleCancelAppointment}
                  loading={cancelling}
                  variant="danger"
                  fullWidth
                >
                  Confirmar Cancelamento
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}