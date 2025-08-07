'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  User,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign
} from 'lucide-react';

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  price: number;
  duration: string;
}

export default function AppointmentsPage() {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'confirmed' | 'pending' | 'cancelled'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const appointments: Appointment[] = [
    {
      id: '1',
      clientName: 'Maria Silva',
      date: '2025-08-07',
      time: '08:00',
      service: 'Treino Personalizado',
      status: 'confirmed',
      price: 150,
      duration: '60 min'
    },
    {
      id: '2',
      clientName: 'João Santos',
      date: '2025-08-07',
      time: '09:00',
      service: 'Avaliação Física',
      status: 'pending',
      price: 100,
      duration: '30 min'
    },
    {
      id: '3',
      clientName: 'Ana Costa',
      date: '2025-08-07',
      time: '10:00',
      service: 'Treino Personalizado',
      status: 'confirmed',
      price: 150,
      duration: '60 min'
    },
    {
      id: '4',
      clientName: 'Pedro Oliveira',
      date: '2025-08-08',
      time: '14:00',
      service: 'Consultoria Nutricional',
      status: 'confirmed',
      price: 200,
      duration: '45 min'
    },
    {
      id: '5',
      clientName: 'Carla Mendes',
      date: '2025-08-08',
      time: '15:00',
      service: 'Treino Personalizado',
      status: 'cancelled',
      price: 150,
      duration: '60 min'
    },
  ];

  const filteredAppointments = selectedFilter === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === selectedFilter);

  const totalRevenue = appointments
    .filter(apt => apt.status === 'confirmed')
    .reduce((sum, apt) => sum + apt.price, 0);

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(apt => apt.status === 'confirmed').length,
    pending: appointments.filter(apt => apt.status === 'pending').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length,
  };

  const handleStatusChange = (appointmentId: string, newStatus: 'confirmed' | 'cancelled') => {
    alert(`Status do agendamento ${appointmentId} alterado para ${newStatus}`);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed':
        return 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300';
      case 'pending':
        return 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300';
      case 'cancelled':
        return 'bg-danger-100 text-danger-700 dark:bg-danger-900/30 dark:text-danger-300';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/trainer">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Todos os Agendamentos
              </h1>
            </div>
            <Link href="/schedule">
              <Button>
                <Calendar className="h-4 w-4 mr-2" />
                Novo Agendamento
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Confirmados</p>
                  <p className="text-2xl font-bold text-success-600">{stats.confirmed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Pendentes</p>
                  <p className="text-2xl font-bold text-warning-600">{stats.pending}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-warning-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Cancelados</p>
                  <p className="text-2xl font-bold text-danger-600">{stats.cancelled}</p>
                </div>
                <XCircle className="h-8 w-8 text-danger-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Receita</p>
                  <p className="text-2xl font-bold text-success-600">
                    R$ {totalRevenue}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-success-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Filtrar:</span>
              {(['all', 'confirmed', 'pending', 'cancelled'] as const).map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter === 'all' ? 'Todos' : 
                   filter === 'confirmed' ? 'Confirmados' :
                   filter === 'pending' ? 'Pendentes' : 'Cancelados'}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Appointments List */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="text-sm font-medium">{appointment.time}</p>
                        <p className="text-xs text-gray-500">{appointment.date}</p>
                      </div>
                      
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {appointment.clientName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {appointment.service} • {appointment.duration}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        R$ {appointment.price}
                      </span>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        {appointment.status === 'confirmed' ? 'Confirmado' :
                         appointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                      </span>

                      {appointment.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success-600 border-success-600 hover:bg-success-50"
                            onClick={() => handleStatusChange(appointment.id, 'confirmed')}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-danger-600 border-danger-600 hover:bg-danger-50"
                            onClick={() => handleStatusChange(appointment.id, 'cancelled')}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}