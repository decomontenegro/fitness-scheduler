'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LineChart, BarChart, PieChart, MetricCard } from '@/components/charts'
import {
  TrophyIcon,
  FireIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ScaleIcon,
  HeartIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { format, subDays, subMonths } from 'date-fns'
import toast from 'react-hot-toast'

interface ClientProgress {
  id: string
  weight?: number
  bodyFat?: number
  muscleMass?: number
  measurements?: any
  currentGoals?: string[]
  achievedGoals?: string[]
  notes?: string
  recordDate: string
}

interface WorkoutStats {
  totalSessions: number
  thisWeekSessions: number
  thisMonthSessions: number
  averageFrequency: number
  favoriteTrainer: string
  favoriteService: string
  consistencyScore: number
}

export default function ClientAnalyticsPage() {
  const { user, token } = useAuth()
  const [progress, setProgress] = useState<ClientProgress[]>([])
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('6m')
  const [activeTab, setActiveTab] = useState('progress')

  useEffect(() => {
    if (user && token && user.role === 'CLIENT') {
      fetchClientAnalytics()
    }
  }, [user, token, period])

  const fetchClientAnalytics = async () => {
    try {
      setLoading(true)

      // Fetch client progress
      const progressResponse = await fetch(
        `/api/clients/progress?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (progressResponse.ok) {
        const progressData = await progressResponse.json()
        setProgress(progressData.progress || [])
      }

      // Fetch workout statistics
      const statsResponse = await fetch(
        `/api/clients/workout-stats?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setWorkoutStats(statsData)
      }

      // Fetch appointments for analysis
      const appointmentsResponse = await fetch(
        `/api/appointments?period=${period}&status=completed`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json()
        setAppointments(appointmentsData.appointments || [])
      }

    } catch (error) {
      console.error('Error fetching client analytics:', error)
      toast.error('Erro ao carregar dados de progresso')
    } finally {
      setLoading(false)
    }
  }

  const calculateProgressPercentage = (current: number, target: number) => {
    if (!target) return 0
    return Math.min((current / target) * 100, 100)
  }

  const getLatestMeasurement = (type: keyof ClientProgress) => {
    if (progress.length === 0) return null
    const latest = progress[progress.length - 1]
    return latest[type] as number
  }

  const getProgressChange = (type: keyof ClientProgress) => {
    if (progress.length < 2) return 0
    const latest = progress[progress.length - 1][type] as number
    const previous = progress[progress.length - 2][type] as number
    if (!latest || !previous) return 0
    return latest - previous
  }

  const formatProgressChange = (change: number, type: string) => {
    const prefix = change > 0 ? '+' : ''
    const suffix = type === 'weight' ? ' kg' : type === 'bodyFat' ? '%' : type === 'muscleMass' ? ' kg' : ''
    return `${prefix}${change.toFixed(1)}${suffix}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user?.role !== 'CLIENT') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-500 mt-2">Esta página é apenas para clientes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meu Progresso</h1>
              <p className="text-gray-500 mt-2">Acompanhe sua evolução e conquiste seus objetivos</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="1y">Último ano</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'progress', name: 'Progresso Físico', icon: ScaleIcon },
                { id: 'workouts', name: 'Treinos', icon: FireIcon },
                { id: 'goals', name: 'Objetivos', icon: TargetIcon },
                { id: 'achievements', name: 'Conquistas', icon: TrophyIcon }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-2 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Peso Atual"
                value={`${getLatestMeasurement('weight')?.toFixed(1) || 0} kg`}
                subtitle={formatProgressChange(getProgressChange('weight'), 'weight')}
                trend={{
                  value: Math.abs(getProgressChange('weight')),
                  isPositive: getProgressChange('weight') < 0 // Weight loss is positive
                }}
                color="blue"
                icon={<ScaleIcon className="h-6 w-6" />}
              />
              
              <MetricCard
                title="Gordura Corporal"
                value={`${getLatestMeasurement('bodyFat')?.toFixed(1) || 0}%`}
                subtitle={formatProgressChange(getProgressChange('bodyFat'), 'bodyFat')}
                trend={{
                  value: Math.abs(getProgressChange('bodyFat')),
                  isPositive: getProgressChange('bodyFat') < 0
                }}
                color="yellow"
                icon={<ChartBarIcon className="h-6 w-6" />}
              />

              <MetricCard
                title="Massa Muscular"
                value={`${getLatestMeasurement('muscleMass')?.toFixed(1) || 0} kg`}
                subtitle={formatProgressChange(getProgressChange('muscleMass'), 'muscleMass')}
                trend={{
                  value: Math.abs(getProgressChange('muscleMass')),
                  isPositive: getProgressChange('muscleMass') > 0
                }}
                color="green"
                icon={<HeartIcon className="h-6 w-6" />}
              />

              <MetricCard
                title="Frequência Semanal"
                value={`${workoutStats?.averageFrequency?.toFixed(1) || 0}x`}
                subtitle="treinos por semana"
                color="purple"
                icon={<CalendarDaysIcon className="h-6 w-6" />}
              />
            </div>

            {/* Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Progress */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Evolução do Peso
                </h3>
                {progress.length > 0 && (
                  <LineChart
                    data={{
                      labels: progress.map(p => format(new Date(p.recordDate), 'dd/MM')),
                      datasets: [{
                        label: 'Peso (kg)',
                        data: progress.map(p => p.weight || 0),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>

              {/* Body Composition */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Composição Corporal
                </h3>
                {progress.length > 0 && (
                  <LineChart
                    data={{
                      labels: progress.map(p => format(new Date(p.recordDate), 'dd/MM')),
                      datasets: [
                        {
                          label: 'Gordura Corporal (%)',
                          data: progress.map(p => p.bodyFat || 0),
                          borderColor: '#F59E0B',
                          backgroundColor: 'rgba(245, 158, 11, 0.1)',
                          yAxisID: 'y'
                        },
                        {
                          label: 'Massa Muscular (kg)',
                          data: progress.map(p => p.muscleMass || 0),
                          borderColor: '#10B981',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          yAxisID: 'y1'
                        }
                      ]
                    }}
                    options={{
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left'
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          grid: {
                            drawOnChartArea: false
                          }
                        }
                      }
                    }}
                    height={300}
                  />
                )}
              </Card>
            </div>

            {/* Body Measurements */}
            {progress.length > 0 && progress[progress.length - 1].measurements && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Medidas Corporais Atuais
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {Object.entries(progress[progress.length - 1].measurements || {}).map(([part, value]) => (
                    <div key={part} className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 capitalize">{part}</p>
                      <p className="text-lg font-semibold text-gray-900">{value} cm</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && workoutStats && (
          <div className="space-y-8">
            {/* Workout Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total de Treinos"
                value={workoutStats.totalSessions}
                color="blue"
                icon={<FireIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Esta Semana"
                value={workoutStats.thisWeekSessions}
                color="green"
                icon={<CalendarDaysIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Este Mês"
                value={workoutStats.thisMonthSessions}
                color="yellow"
                icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Score de Consistência"
                value={`${workoutStats.consistencyScore}%`}
                color="purple"
                icon={<TrophyIcon className="h-6 w-6" />}
              />
            </div>

            {/* Workout Frequency Chart */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Frequência de Treinos por Semana
              </h3>
              {appointments.length > 0 && (
                <LineChart
                  data={{
                    labels: Array.from({ length: 12 }, (_, i) => {
                      const date = subDays(new Date(), i * 7)
                      return format(date, 'dd/MM')
                    }).reverse(),
                    datasets: [{
                      label: 'Treinos na Semana',
                      data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 5) + 1), // Mock data
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                      tension: 0.4
                    }]
                  }}
                  height={300}
                />
              )}
            </Card>

            {/* Favorite Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Trainer Favorito
                </h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{workoutStats.favoriteTrainer || 'Nenhum'}</p>
                  <p className="text-sm text-gray-500">Mais treinos realizados</p>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Serviço Favorito
                </h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FireIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-xl font-semibold text-gray-900">{workoutStats.favoriteService || 'Nenhum'}</p>
                  <p className="text-sm text-gray-500">Mais praticado</p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === 'goals' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Current Goals */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Objetivos Atuais
                </h3>
                {progress.length > 0 && progress[progress.length - 1].currentGoals ? (
                  <div className="space-y-3">
                    {progress[progress.length - 1].currentGoals!.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <TargetIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-900">{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum objetivo definido</p>
                )}
              </Card>

              {/* Achieved Goals */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Objetivos Conquistados
                </h3>
                {progress.length > 0 && progress[progress.length - 1].achievedGoals ? (
                  <div className="space-y-3">
                    {progress[progress.length - 1].achievedGoals!.map((goal, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <TrophyIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                        <span className="text-gray-900">{goal}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhum objetivo conquistado ainda</p>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-8">
            {/* Achievement Badges */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[
                { name: 'Primeira Semana', description: 'Complete 3 treinos na primeira semana', earned: true },
                { name: 'Consistente', description: '4 semanas seguidas treinando', earned: true },
                { name: 'Dedicado', description: '50 treinos completados', earned: workoutStats && workoutStats.totalSessions >= 50 },
                { name: 'Transformação', description: 'Perda de 5kg ou mais', earned: Math.abs(getProgressChange('weight')) >= 5 },
                { name: 'Força', description: 'Ganho de 2kg de massa muscular', earned: getProgressChange('muscleMass') >= 2 },
                { name: 'Definição', description: 'Redução de 5% de gordura corporal', earned: Math.abs(getProgressChange('bodyFat')) >= 5 },
                { name: 'Fidelidade', description: '6 meses de treinos regulares', earned: false },
                { name: 'Champion', description: '100 treinos completados', earned: workoutStats && workoutStats.totalSessions >= 100 }
              ].map((achievement, index) => (
                <div
                  key={index}
                  className={`
                    p-4 rounded-lg border-2 text-center transition-all duration-200
                    ${achievement.earned
                      ? 'border-yellow-400 bg-yellow-50 shadow-lg'
                      : 'border-gray-200 bg-gray-50 opacity-60'
                    }
                  `}
                >
                  <div className={`
                    w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center
                    ${achievement.earned
                      ? 'bg-yellow-400 text-white'
                      : 'bg-gray-300 text-gray-500'
                    }
                  `}>
                    <TrophyIcon className="h-6 w-6" />
                  </div>
                  <h4 className={`font-semibold ${achievement.earned ? 'text-yellow-800' : 'text-gray-500'}`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm mt-1 ${achievement.earned ? 'text-yellow-700' : 'text-gray-400'}`}>
                    {achievement.description}
                  </p>
                  {achievement.earned && (
                    <div className="mt-2 text-xs font-medium text-yellow-600">
                      ✓ Conquistado
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}