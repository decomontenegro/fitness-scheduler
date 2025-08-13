'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Star, 
  Clock,
  ChevronRight,
  Plus,
  MessageSquare,
  TrendingUp,
  Activity,
  LogOut
} from 'lucide-react';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface Stats {
  totalClients: number;
  thisWeekAppointments: number;
  thisMonthRevenue: number;
  averageRating: number;
}

interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  client: {
    user: {
      name: string;
      avatar?: string;
    };
  };
  service: {
    name: string;
    duration: number;
    price: number;
  };
}

export default function TrainerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    thisWeekAppointments: 0,
    thisMonthRevenue: 0,
    averageRating: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [weeklyOccupation, setWeeklyOccupation] = useState<any[]>([]);
  
  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      router.push('/login');
    }
  };

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointment(appointment);
    const time = new Date(appointment.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    alert(`Detalhes do Agendamento:\n\nCliente: ${appointment.client.user.name}\nHorário: ${time}\nServiço: ${appointment.service.name}\nStatus: ${appointment.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}\n\n(Modal de detalhes será implementado em breve)`);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Check authentication
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

        // Fetch dashboard data
        const dashboardData = await api.getDashboard('trainer');
        
        // Update stats
        if (dashboardData.stats) {
          setStats(dashboardData.stats);
        }
        
        // Update today's appointments
        if (dashboardData.todayAppointments) {
          setTodayAppointments(dashboardData.todayAppointments);
        }
        
        // Update weekly occupation
        if (dashboardData.weeklyOccupation) {
          setWeeklyOccupation(dashboardData.weeklyOccupation);
        }
      } catch (error: any) {
        console.error('Dashboard error:', error);
        toast.error('Erro ao carregar dashboard');
        
        // If unauthorized, redirect to login
        if (error.message?.includes('401') || error.message?.includes('Sessão expirada')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Olá, {user.name}! 👋
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {new Date().toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/analytics">
                <Button variant="outline" size="sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </Link>
              <Link href="/reports">
                <Button variant="outline" size="sm">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </Link>
              <Link href="/messages">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Mensagens
                </Button>
              </Link>
              <Link href="/trainer/schedule">
                <Button size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Minha Agenda
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-custom py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total de Clientes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalClients}
                  </p>
                  <p className="text-xs text-success-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% este mês
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Agendamentos Semana</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.thisWeekAppointments}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {todayAppointments.length} agendamentos hoje
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-secondary-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Receita do Mês</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    R$ {stats.thisMonthRevenue.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-success-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +25% vs mês anterior
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-success-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avaliação Média</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.averageRating.toFixed(1)}
                  </p>
                  <div className="flex items-center mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-3 w-3 ${i < Math.floor(stats.averageRating) ? 'fill-warning-400 text-warning-400' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">(45 avaliações)</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-warning-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/trainer/schedule">
            <Card className="hover-lift cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                        <Calendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="font-semibold">Minha Agenda</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Visualize e gerencie seus agendamentos
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/trainer/availability">
            <Card className="hover-lift cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-success-100 dark:bg-success-900/30 rounded-lg">
                        <Clock className="h-6 w-6 text-success-600 dark:text-success-400" />
                      </div>
                      <h3 className="font-semibold">Disponibilidade</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Configure seus horários de atendimento
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/trainer/services">
            <Card className="hover-lift cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
                        <Activity className="h-6 w-6 text-warning-600 dark:text-warning-400" />
                      </div>
                      <h3 className="font-semibold">Serviços</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Gerencie seus tipos de treino e preços
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Agenda de Hoje</span>
                  <Link href="/appointments">
                    <Button variant="ghost" size="sm">
                      Ver Tudo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayAppointments.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Nenhum agendamento para hoje
                    </p>
                  ) : (
                    todayAppointments.map((appointment) => {
                      const time = new Date(appointment.startTime).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      });
                      
                      return (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                              <Clock className="h-4 w-4 text-gray-400 mb-1" />
                              <span className="text-sm font-medium">{time}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {appointment.client.user.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {appointment.service.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'CONFIRMED' 
                                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                                : 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300'
                            }`}>
                              {appointment.status === 'CONFIRMED' ? 'Confirmado' : 'Pendente'}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleAppointmentClick(appointment)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Week Occupancy */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Ocupação Semanal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyOccupation.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">
                      Sem dados de ocupação
                    </p>
                  ) : (
                    weeklyOccupation.map((day) => {
                      const maxAppointmentsPerDay = 8; // Assuming 8 hours work day
                      const percentage = Math.min((day.appointments / maxAppointmentsPerDay) * 100, 100);
                      
                      return (
                        <div key={day.day}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {day.day}
                            </span>
                            <span className="text-sm text-gray-500">
                              {day.appointments} treinos
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                percentage >= 80 
                                  ? 'bg-success-500' 
                                  : percentage >= 60 
                                  ? 'bg-warning-500' 
                                  : 'bg-primary-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Taxa de Ocupação
                    </span>
                    <span className="text-lg font-bold gradient-text">
                      {weeklyOccupation.length > 0 
                        ? `${Math.round(weeklyOccupation.reduce((acc, day) => acc + day.appointments, 0) / (weeklyOccupation.length * 8) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button fullWidth variant="outline" className="justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Gerenciar Disponibilidade
                </Button>
                <Button fullWidth variant="outline" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Meus Clientes
                </Button>
                <Button fullWidth variant="outline" className="justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}