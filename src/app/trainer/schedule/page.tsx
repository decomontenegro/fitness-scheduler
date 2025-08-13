'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number;
  notes?: string;
  client: {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      avatar?: string;
    };
  };
  service: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendente', color: 'warning', icon: AlertCircle },
  CONFIRMED: { label: 'Confirmado', color: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', color: 'error', icon: XCircle },
  COMPLETED: { label: 'Concluído', color: 'info', icon: CheckCircle }
};

export default function TrainerSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchAppointments();
  }, [selectedDate]);

  const checkAuth = () => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (!storedUser || !storedToken) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role !== 'TRAINER') {
      router.push('/dashboard/client');
      return;
    }

    setUser(userData);
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/appointments?date=${dateStr}`, {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        toast.error('Sessão expirada');
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      
      const response = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Status atualizado para ${STATUS_LABELS[newStatus].label}`);
        
        // Atualizar localmente
        setAppointments(prev => prev.map(apt => 
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        ));
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const navigateDate = (direction: number) => {
    setSelectedDate(prev => addDays(prev, direction));
  };

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt => 
      isSameDay(parseISO(apt.date), date)
    );
  };

  const formatTime = (timeString: string) => {
    const date = parseISO(timeString);
    return format(date, 'HH:mm');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const todayAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/dashboard/trainer')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Minha Agenda
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Visualize e gerencie seus agendamentos
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedDate(new Date())}
                className="btn-outline"
              >
                Hoje
              </Button>
            </div>
          </div>
        </div>

        {/* Date Navigation */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(selectedDate, 'yyyy')}
                </p>
              </div>
              
              <button
                onClick={() => navigateDate(1)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{todayAppointments.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confirmados</p>
                  <p className="text-2xl font-bold text-success-600">
                    {todayAppointments.filter(a => a.status === 'CONFIRMED').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-success-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold text-warning-600">
                    {todayAppointments.filter(a => a.status === 'PENDING').length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-warning-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receita</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(
                      todayAppointments
                        .filter(a => a.status !== 'CANCELLED')
                        .reduce((sum, a) => sum + a.price, 0)
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Appointments List */}
        {todayAppointments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                Nenhum agendamento para esta data
              </p>
              <p className="text-sm text-gray-400">
                Os clientes podem agendar através da plataforma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {todayAppointments
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map((appointment) => {
                const StatusIcon = STATUS_LABELS[appointment.status].icon;
                const statusColor = STATUS_LABELS[appointment.status].color;
                
                return (
                  <Card key={appointment.id} className="hover-lift">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {appointment.client.user.avatar ? (
                              <img
                                src={appointment.client.user.avatar}
                                alt={appointment.client.user.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {appointment.client.user.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          
                          {/* Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold">
                                {appointment.client.user.name}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1
                                ${statusColor === 'success' ? 'bg-success-100 text-success-700' : ''}
                                ${statusColor === 'warning' ? 'bg-warning-100 text-warning-700' : ''}
                                ${statusColor === 'error' ? 'bg-error-100 text-error-700' : ''}
                                ${statusColor === 'info' ? 'bg-info-100 text-info-700' : ''}
                              `}>
                                <StatusIcon className="w-3 h-3" />
                                {STATUS_LABELS[appointment.status].label}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>
                                  {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                                </span>
                                <span className="text-gray-400">•</span>
                                <span>{appointment.service.name}</span>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {appointment.client.user.phone && (
                                  <a
                                    href={`tel:${appointment.client.user.phone}`}
                                    className="flex items-center gap-1 hover:text-primary-500"
                                  >
                                    <Phone className="w-4 h-4" />
                                    {appointment.client.user.phone}
                                  </a>
                                )}
                                <a
                                  href={`mailto:${appointment.client.user.email}`}
                                  className="flex items-center gap-1 hover:text-primary-500"
                                >
                                  <Mail className="w-4 h-4" />
                                  {appointment.client.user.email}
                                </a>
                              </div>
                              
                              {appointment.notes && (
                                <p className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                  <strong>Observações:</strong> {appointment.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xl font-bold text-primary-600">
                            {formatCurrency(appointment.price)}
                          </div>
                          
                          {appointment.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleStatusChange(appointment.id, 'CONFIRMED')}
                                className="btn-primary btn-sm"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Confirmar
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(appointment.id, 'CANCELLED')}
                                className="btn-outline btn-sm"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </div>
                          )}
                          
                          {appointment.status === 'CONFIRMED' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleStatusChange(appointment.id, 'COMPLETED')}
                                className="btn-outline btn-sm"
                              >
                                Concluir
                              </Button>
                              <Button
                                onClick={() => handleStatusChange(appointment.id, 'CANCELLED')}
                                className="text-error-600 hover:bg-error-100 btn-sm"
                              >
                                Cancelar
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}