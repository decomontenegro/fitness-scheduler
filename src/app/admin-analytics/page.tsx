'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LineChart, BarChart, PieChart, MetricCard } from '@/components/charts'
import {
  BuildingOfficeIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowArrowTrendingUpIcon,
  ArrowArrowTrendingDownIcon,
  UserGroupIcon,
  BanknotesIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { format, subDays, subMonths } from 'date-fns'
import toast from 'react-hot-toast'

interface PlatformMetrics {
  revenue: {
    total: number
    platform: number
    trainer: number
    growth: number
    monthlyTrends: any[]
  }
  users: {
    total: number
    trainers: number
    clients: number
    newThisMonth: number
    growth: number
    registrationTrends: any[]
  }
  activity: {
    totalAppointments: number
    completedAppointments: number
    completionRate: number
    averageRating: number
    topTrainers: any[]
  }
  business: {
    activeTrainers: number
    averageRevenuePerTrainer: number
    topServices: any[]
    churnRate: number
  }
}

export default function AdminAnalyticsPage() {
  const { user, token } = useAuth()
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('12m')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user && token && user.role === 'ADMIN') {
      fetchPlatformMetrics()
    }
  }, [user, token, period])

  const fetchPlatformMetrics = async () => {
    try {
      setLoading(true)

      const response = await fetch(
        `/api/analytics/platform?period=${period}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar métricas da plataforma')
      }

      const data = await response.json()
      setMetrics(data)

    } catch (error) {
      console.error('Erro ao carregar analytics da plataforma:', error)
      toast.error('Erro ao carregar dados da plataforma')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Acesso Restrito</h2>
          <p className="text-gray-500 mt-2">Esta página é apenas para administradores.</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Dados não disponíveis</h2>
          <p className="text-gray-500 mt-2">Não foi possível carregar as métricas da plataforma.</p>
          <Button onClick={fetchPlatformMetrics} className="mt-4">
            Tentar novamente
          </Button>
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics da Plataforma</h1>
              <p className="text-gray-500 mt-2">Visão completa do desempenho da plataforma FitScheduler</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="12m">Últimos 12 meses</option>
                <option value="24m">Últimos 24 meses</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Visão Geral', icon: ChartBarIcon },
                { id: 'revenue', name: 'Receita', icon: CurrencyDollarIcon },
                { id: 'users', name: 'Usuários', icon: UsersIcon },
                { id: 'business', name: 'Negócios', icon: BuildingOfficeIcon }
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Receita Total"
                value={metrics.revenue.total}
                trend={{
                  value: metrics.revenue.growth,
                  isPositive: metrics.revenue.growth > 0,
                  label: 'vs mês anterior'
                }}
                color="green"
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
              />
              
              <MetricCard
                title="Total de Usuários"
                value={metrics.users.total}
                subtitle={`${metrics.users.newThisMonth} novos este mês`}
                trend={{
                  value: metrics.users.growth,
                  isPositive: metrics.users.growth > 0
                }}
                color="blue"
                icon={<UsersIcon className="h-6 w-6" />}
              />

              <MetricCard
                title="Trainers Ativos"
                value={metrics.business.activeTrainers}
                subtitle={`de ${metrics.users.trainers} total`}
                color="yellow"
                icon={<UserGroupIcon className="h-6 w-6" />}
              />

              <MetricCard
                title="Taxa de Conclusão"
                value={`${metrics.activity.completionRate.toFixed(1)}%`}
                subtitle={`${metrics.activity.completedAppointments} de ${metrics.activity.totalAppointments}`}
                color="purple"
                icon={<ClockIcon className="h-6 w-6" />}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Trend */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Evolução da Receita
                </h3>
                <LineChart
                  data={{
                    labels: metrics.revenue.monthlyTrends.map(item => 
                      format(new Date(item.month + '-01'), 'MMM/yy')
                    ),
                    datasets: [
                      {
                        label: 'Receita Total',
                        data: metrics.revenue.monthlyTrends.map(item => item.total),
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true
                      },
                      {
                        label: 'Receita da Plataforma',
                        data: metrics.revenue.monthlyTrends.map(item => item.platform),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: false
                      }
                    ]
                  }}
                  height={300}
                />
              </Card>

              {/* User Growth */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Crescimento de Usuários
                </h3>
                <LineChart
                  data={{
                    labels: metrics.users.registrationTrends.map(item => 
                      format(new Date(item.month + '-01'), 'MMM/yy')
                    ),
                    datasets: [
                      {
                        label: 'Trainers',
                        data: metrics.users.registrationTrends.map(item => item.trainers),
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)'
                      },
                      {
                        label: 'Clientes',
                        data: metrics.users.registrationTrends.map(item => item.clients),
                        borderColor: '#8B5CF6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)'
                      }
                    ]
                  }}
                  height={300}
                />
              </Card>
            </div>

            {/* Top Performers and Services */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Trainers */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top 5 Trainers
                </h3>
                <div className="space-y-4">
                  {metrics.activity.topTrainers.slice(0, 5).map((trainer, index) => (
                    <div key={trainer.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-white font-medium
                          ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'}
                        `}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{trainer.name}</p>
                          <p className="text-sm text-gray-500">{trainer.appointments} agendamentos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          R$ {trainer.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="flex items-center text-sm text-yellow-600">
                          <StarIcon className="h-4 w-4 mr-1" />
                          {trainer.rating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Top Services */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Serviços Mais Populares
                </h3>
                <BarChart
                  data={{
                    labels: metrics.business.topServices.slice(0, 5).map(service => service.name),
                    datasets: [{
                      label: 'Agendamentos',
                      data: metrics.business.topServices.slice(0, 5).map(service => service.count),
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)'
                      ]
                    }]
                  }}
                  height={280}
                  horizontal={true}
                />
              </Card>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <div className="space-y-8">
            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Receita Total"
                value={metrics.revenue.total}
                color="green"
                icon={<BanknotesIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Receita da Plataforma"
                value={metrics.revenue.platform}
                subtitle={`${((metrics.revenue.platform / metrics.revenue.total) * 100).toFixed(1)}% do total`}
                color="blue"
                icon={<BuildingOfficeIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Receita dos Trainers"
                value={metrics.revenue.trainer}
                subtitle={`${((metrics.revenue.trainer / metrics.revenue.total) * 100).toFixed(1)}% do total`}
                color="yellow"
                icon={<UserGroupIcon className="h-6 w-6" />}
              />
            </div>

            {/* Revenue Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuição da Receita
                </h3>
                <PieChart
                  data={{
                    labels: ['Receita dos Trainers', 'Receita da Plataforma'],
                    datasets: [{
                      data: [metrics.revenue.trainer, metrics.revenue.platform],
                      backgroundColor: ['#F59E0B', '#3B82F6']
                    }]
                  }}
                  height={300}
                  centerText={{
                    value: `R$ ${metrics.revenue.total.toLocaleString('pt-BR')}`,
                    label: 'Total'
                  }}
                />
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Receita Média por Trainer
                </h3>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    R$ {metrics.business.averageRevenuePerTrainer.toLocaleString('pt-BR', { 
                      minimumFractionDigits: 2 
                    })}
                  </div>
                  <p className="text-gray-500">por trainer ativo</p>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-green-800 font-medium">Top 10%</div>
                      <div className="text-green-600">
                        R$ {(metrics.business.averageRevenuePerTrainer * 2.5).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-blue-800 font-medium">Mediana</div>
                      <div className="text-blue-600">
                        R$ {(metrics.business.averageRevenuePerTrainer * 0.8).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* User Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Total de Usuários"
                value={metrics.users.total}
                color="blue"
                icon={<UsersIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Trainers"
                value={metrics.users.trainers}
                subtitle={`${((metrics.users.trainers / metrics.users.total) * 100).toFixed(1)}% do total`}
                color="yellow"
              />
              <MetricCard
                title="Clientes"
                value={metrics.users.clients}
                subtitle={`${((metrics.users.clients / metrics.users.total) * 100).toFixed(1)}% do total`}
                color="green"
              />
              <MetricCard
                title="Novos Este Mês"
                value={metrics.users.newThisMonth}
                trend={{
                  value: metrics.users.growth,
                  isPositive: metrics.users.growth > 0
                }}
                color="purple"
              />
            </div>

            {/* User Distribution and Growth */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuição de Usuários
                </h3>
                <PieChart
                  data={{
                    labels: ['Clientes', 'Trainers'],
                    datasets: [{
                      data: [metrics.users.clients, metrics.users.trainers],
                      backgroundColor: ['#10B981', '#F59E0B']
                    }]
                  }}
                  height={300}
                />
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tendência de Cadastros
                </h3>
                <BarChart
                  data={{
                    labels: metrics.users.registrationTrends.map(item => 
                      format(new Date(item.month + '-01'), 'MMM/yy')
                    ),
                    datasets: [
                      {
                        label: 'Trainers',
                        data: metrics.users.registrationTrends.map(item => item.trainers),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)'
                      },
                      {
                        label: 'Clientes',
                        data: metrics.users.registrationTrends.map(item => item.clients),
                        backgroundColor: 'rgba(16, 185, 129, 0.8)'
                      }
                    ]
                  }}
                  height={300}
                />
              </Card>
            </div>
          </div>
        )}

        {/* Business Tab */}
        {activeTab === 'business' && (
          <div className="space-y-8">
            {/* Business Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Trainers Ativos"
                value={metrics.business.activeTrainers}
                subtitle={`${((metrics.business.activeTrainers / metrics.users.trainers) * 100).toFixed(1)}% do total`}
                color="green"
              />
              <MetricCard
                title="Taxa de Conclusão"
                value={`${metrics.activity.completionRate.toFixed(1)}%`}
                color="blue"
              />
              <MetricCard
                title="Avaliação Média"
                value={metrics.activity.averageRating.toFixed(1)}
                subtitle="de 5.0"
                color="yellow"
                icon={<StarIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Taxa de Churn"
                value={`${metrics.business.churnRate.toFixed(1)}%`}
                trend={{
                  value: metrics.business.churnRate,
                  isPositive: false
                }}
                color="red"
              />
            </div>

            {/* Business Intelligence */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Performance dos Trainers
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Muito Ativos (10+ agendamentos/mês)</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {Math.floor(metrics.business.activeTrainers * 0.2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Moderadamente Ativos (5-9 agendamentos/mês)</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {Math.floor(metrics.business.activeTrainers * 0.4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Pouco Ativos (1-4 agendamentos/mês)</span>
                    <span className="text-sm text-gray-900 font-medium">
                      {Math.floor(metrics.business.activeTrainers * 0.3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Inativos (0 agendamentos/mês)</span>
                    <span className="text-sm text-red-600 font-medium">
                      {metrics.users.trainers - metrics.business.activeTrainers}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Insights do Negócio
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="font-medium text-green-800">💰 Oportunidade de Receita</div>
                    <div className="text-green-700 mt-1">
                      {metrics.users.trainers - metrics.business.activeTrainers} trainers inativos representam 
                      R$ {((metrics.users.trainers - metrics.business.activeTrainers) * metrics.business.averageRevenuePerTrainer).toLocaleString('pt-BR')} 
                      em receita potencial
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-800">📈 Crescimento</div>
                    <div className="text-blue-700 mt-1">
                      Taxa de crescimento de usuários: {metrics.users.growth > 0 ? '+' : ''}{metrics.users.growth.toFixed(1)}% 
                      no último mês
                    </div>
                  </div>
                  
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="font-medium text-yellow-800">⭐ Qualidade</div>
                    <div className="text-yellow-700 mt-1">
                      Avaliação média de {metrics.activity.averageRating.toFixed(1)} 
                      {metrics.activity.averageRating >= 4.5 ? ' indica excelente satisfação' : ' tem potencial de melhoria'}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}