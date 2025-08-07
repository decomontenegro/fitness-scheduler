'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Calendar, 
  Clock,
  ChevronRight,
  Plus,
  Trophy,
  Target,
  Dumbbell,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  LogOut
} from 'lucide-react';

interface NextAppointment {
  id: string;
  trainerName: string;
  date: string;
  time: string;
  service: string;
  status: string;
}

interface TrainingHistory {
  id: string;
  date: string;
  trainer: string;
  service: string;
  duration: string;
  status: string;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push('/login');
  };
  
  const [nextAppointment, setNextAppointment] = useState<NextAppointment>({
    id: '1',
    trainerName: 'João Personal',
    date: 'Amanhã',
    time: '10:00',
    service: 'Treino Personalizado',
    status: 'confirmed',
  });

  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([
    {
      id: '1',
      date: '03/12/2024',
      trainer: 'João Personal',
      service: 'Treino Personalizado',
      duration: '60 min',
      status: 'completed',
    },
    {
      id: '2',
      date: '01/12/2024',
      trainer: 'João Personal',
      service: 'Avaliação Física',
      duration: '30 min',
      status: 'completed',
    },
    {
      id: '3',
      date: '28/11/2024',
      trainer: 'João Personal',
      service: 'Treino Personalizado',
      duration: '60 min',
      status: 'completed',
    },
  ]);

  const goals = [
    { label: 'Treinos este mês', current: 12, target: 16, unit: 'sessões' },
    { label: 'Peso atual', current: 75, target: 70, unit: 'kg' },
    { label: 'Frequência semanal', current: 3, target: 4, unit: 'dias' },
  ];

  const motivationalQuotes = [
    "Cada treino é um passo mais perto do seu objetivo! 💪",
    "A consistência é a chave do sucesso! 🎯",
    "Você está no caminho certo! Continue assim! 🚀",
    "Supere seus limites a cada dia! 🏆",
  ];

  const [quote] = useState(motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]);

  useEffect(() => {
    // Check authentication
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    
    if (!storedUser || !storedToken) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    if (userData.role !== 'CLIENT') {
      router.push('/dashboard/trainer');
      return;
    }

    setUser(userData);
  }, [router]);

  if (!user) {
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
                Olá, {user.name}! 💪
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {quote}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/schedule">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agendar Treino
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
        {/* Next Appointment Alert */}
        {nextAppointment && (
          <Card className="mb-8 border-primary-200 bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-primary-900/20 dark:to-secondary-900/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                    <AlertCircle className="h-6 w-6 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Próximo Treino
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {nextAppointment.date} às {nextAppointment.time}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {nextAppointment.service} com {nextAppointment.trainerName}
                    </p>
                  </div>
                </div>
                <Button variant="outline">
                  Ver Detalhes
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {goals.map((goal, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {goal.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {goal.current}
                      <span className="text-sm text-gray-500 ml-1">{goal.unit}</span>
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    {index === 0 && <Dumbbell className="h-5 w-5 text-primary-600" />}
                    {index === 1 && <Target className="h-5 w-5 text-primary-600" />}
                    {index === 2 && <Heart className="h-5 w-5 text-primary-600" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Meta: {goal.target} {goal.unit}</span>
                    <span className="text-gray-500">
                      {Math.round((goal.current / goal.target) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
                      style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Training History */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Histórico de Treinos</span>
                  <Button variant="ghost" size="sm">
                    Ver Tudo
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trainingHistory.map((training) => (
                    <div
                      key={training.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-success-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {training.service}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {training.date} • {training.duration} • {training.trainer}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats & Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Conquistas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-warning-100 dark:bg-warning-900/30 rounded-full flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-warning-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Sequência de 7 dias
                      </p>
                      <p className="text-xs text-gray-500">Continue assim!</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center">
                      <Target className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Meta mensal atingida
                      </p>
                      <p className="text-xs text-gray-500">12 de 12 treinos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Evolução constante
                      </p>
                      <p className="text-xs text-gray-500">+15% força este mês</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mini Calendar */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dezembro 2024
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <div key={i} className="text-xs font-medium text-gray-500 p-1">
                      {day}
                    </div>
                  ))}
                  {[...Array(31)].map((_, i) => {
                    const hasTraining = [3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26, 29].includes(i + 1);
                    const isToday = i + 1 === new Date().getDate();
                    return (
                      <div
                        key={i}
                        className={`
                          text-xs p-1 rounded cursor-pointer transition-colors
                          ${hasTraining ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium' : ''}
                          ${isToday ? 'ring-2 ring-primary-500' : ''}
                          ${!hasTraining && !isToday ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}
                        `}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary-100 dark:bg-primary-900/30 rounded"></div>
                      <span className="text-gray-600 dark:text-gray-400">Treino realizado</span>
                    </div>
                    <span className="font-medium gradient-text">12 treinos</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}