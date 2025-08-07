'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LineChart, BarChart, PieChart, HeatmapChart, MetricCard } from '@/components/charts'
import {
  CalendarIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'
import { format, subDays } from 'date-fns'
import toast from 'react-hot-toast'

interface AnalyticsData {
  revenue: any
  occupancy: any
  clients: any
  performance: any
  noshow: any
}

export default function AnalyticsPage() {
  const { user, token } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [occupancyData, setOccupancyData] = useState<any>(null)
  const [revenueData, setRevenueData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (user && token) {
      fetchAnalyticsData()
    }
  }, [user, token, period])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)

      // Fetch main metrics
      const metricsResponse = await fetch(
        `/api/analytics/metrics?period=${period}&metrics=revenue,occupancy,clients,performance,noshow`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!metricsResponse.ok) {
        throw new Error('Erro ao carregar métricas')
      }

      const metrics = await metricsResponse.json()
      setAnalyticsData(metrics)

      // Fetch detailed occupancy data
      const occupancyResponse = await fetch(
        `/api/analytics/occupancy?period=${period}&view=all`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (occupancyResponse.ok) {
        const occupancy = await occupancyResponse.json()
        setOccupancyData(occupancy)
      }

      // Fetch detailed revenue data
      const revenueResponse = await fetch(
        `/api/analytics/revenue?period=12m&comparison=previous_period`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (revenueResponse.ok) {
        const revenue = await revenueResponse.json()
        setRevenueData(revenue)
      }

    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
      toast.error('Erro ao carregar dados de analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: 'financial',
          format,
          period,
          includeCharts: format === 'pdf'
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-${format === 'pdf' ? 'pdf' : 'excel'}-${format(new Date(), 'yyyy-MM-dd')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Relatório gerado com sucesso!')
    } catch (error) {
      console.error('Erro ao exportar relatório:', error)
      toast.error('Erro ao gerar relatório')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Dados não disponíveis</h2>
          <p className="text-gray-500 mt-2">Não foi possível carregar os dados de analytics.</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-500 mt-2">Análise detalhada do seu desempenho</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Period Selector */}
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="3m">Últimos 3 meses</option>
                <option value="6m">Últimos 6 meses</option>
                <option value="1y">Último ano</option>
              </select>

              {/* Export Options */}
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport('pdf')}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportReport('excel')}
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Visão Geral', icon: ChartBarIcon },
                { id: 'revenue', name: 'Receita', icon: CurrencyDollarIcon },
                { id: 'occupancy', name: 'Ocupação', icon: CalendarIcon },
                { id: 'clients', name: 'Clientes', icon: UsersIcon },
                { id: 'performance', name: 'Performance', icon: ArrowTrendingUpIcon }
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

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Receita Total"
                value={analyticsData.revenue?.total || 0}
                trend={{
                  value: analyticsData.revenue?.growth || 0,
                  isPositive: (analyticsData.revenue?.growth || 0) > 0
                }}
                color="green"
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
              />
              
              <MetricCard
                title="Taxa de Ocupação"
                value={`${analyticsData.occupancy?.occupancyRate?.toFixed(1) || 0}%`}
                subtitle={`${analyticsData.occupancy?.bookedSlots || 0} de ${analyticsData.occupancy?.totalSlots || 0} slots`}
                color="blue"
                icon={<CalendarIcon className="h-6 w-6" />}
              />

              <MetricCard
                title="Clientes Ativos"
                value={analyticsData.clients?.activeClients || 0}
                subtitle={`${analyticsData.clients?.newClients || 0} novos clientes`}
                color="yellow"
                icon={<UsersIcon className="h-6 w-6" />}
              />

              <MetricCard
                title="Avaliação Média"
                value={analyticsData.performance?.rating?.toFixed(1) || '0.0'}
                subtitle={`${analyticsData.performance?.totalReviews || 0} avaliações`}
                color="gray"
                icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Receita ao Longo do Tempo
                </h3>
                {analyticsData.revenue?.revenueByDay && (
                  <LineChart
                    data={{
                      labels: analyticsData.revenue.revenueByDay.map((item: any) => 
                        format(new Date(item.date), 'dd/MM')
                      ),
                      datasets: [{
                        label: 'Receita',
                        data: analyticsData.revenue.revenueByDay.map((item: any) => item.amount),
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

              {/* Occupancy Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Taxa de Ocupação Diária
                </h3>
                {analyticsData.occupancy?.occupancyByDay && (
                  <BarChart
                    data={{
                      labels: analyticsData.occupancy.occupancyByDay.map((item: any) => 
                        format(new Date(item.date), 'dd/MM')
                      ),
                      datasets: [{
                        label: 'Ocupação (%)',
                        data: analyticsData.occupancy.occupancyByDay.map((item: any) => item.occupancy),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: '#3B82F6',
                        borderWidth: 1
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>
            </div>

            {/* Service Performance and Peak Hours */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Services Revenue */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Receita por Serviço
                </h3>
                {analyticsData.revenue?.revenueByService && (
                  <PieChart
                    data={{
                      labels: analyticsData.revenue.revenueByService.map((item: any) => item.service),
                      datasets: [{
                        data: analyticsData.revenue.revenueByService.map((item: any) => item.amount),
                        backgroundColor: [
                          '#10B981',
                          '#3B82F6',
                          '#F59E0B',
                          '#EF4444',
                          '#8B5CF6',
                          '#06B6D4'
                        ]
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>

              {/* Peak Hours */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Horários de Pico
                </h3>
                {analyticsData.occupancy?.peakHours && (
                  <BarChart
                    data={{
                      labels: analyticsData.occupancy.peakHours.map((item: any) => 
                        `${item.hour.toString().padStart(2, '0')}:00`
                      ),
                      datasets: [{
                        label: 'Agendamentos',
                        data: analyticsData.occupancy.peakHours.map((item: any) => item.appointments),
                        backgroundColor: 'rgba(245, 158, 11, 0.8)',
                        borderColor: '#F59E0B',
                        borderWidth: 1
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && revenueData && (
          <div className="space-y-8">
            {/* Revenue Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Receita Total"
                value={revenueData.current?.summary?.totalRevenue || 0}
                subtitle="Período atual"
                color="green"
                icon={<CurrencyDollarIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Ticket Médio"
                value={revenueData.current?.summary?.averageTransactionValue || 0}
                color="blue"
                icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Total de Transações"
                value={revenueData.current?.summary?.transactionCount || 0}
                color="yellow"
                icon={<ChartBarIcon className="h-6 w-6" />}
              />
            </div>

            {/* Monthly Revenue Trend */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Evolução Mensal da Receita
              </h3>
              {revenueData.current?.trends?.revenueByMonth && (
                <LineChart
                  data={{
                    labels: revenueData.current.trends.revenueByMonth.map((item: any) => 
                      format(new Date(item.month + '-01'), 'MMM/yyyy')
                    ),
                    datasets: [{
                      label: 'Receita',
                      data: revenueData.current.trends.revenueByMonth.map((item: any) => item.revenue),
                      borderColor: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)',
                      fill: true,
                      tension: 0.4
                    }]
                  }}
                  height={400}
                />
              )}
            </Card>

            {/* Revenue Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Receita por Método de Pagamento
                </h3>
                {revenueData.current?.breakdown?.byPaymentMethod && (
                  <PieChart
                    data={{
                      labels: revenueData.current.breakdown.byPaymentMethod.map((item: any) => item.method),
                      datasets: [{
                        data: revenueData.current.breakdown.byPaymentMethod.map((item: any) => item.revenue),
                        backgroundColor: [
                          '#10B981',
                          '#3B82F6',
                          '#F59E0B',
                          '#EF4444',
                          '#8B5CF6'
                        ]
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Top 5 Serviços
                </h3>
                {revenueData.current?.insights?.topServices && (
                  <BarChart
                    data={{
                      labels: revenueData.current.insights.topServices.slice(0, 5).map((item: any) => item.service),
                      datasets: [{
                        label: 'Receita',
                        data: revenueData.current.insights.topServices.slice(0, 5).map((item: any) => item.revenue),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: '#3B82F6',
                        borderWidth: 1
                      }]
                    }}
                    height={300}
                    horizontal={true}
                  />
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Occupancy Tab */}
        {activeTab === 'occupancy' && occupancyData && (
          <div className="space-y-8">
            {/* Occupancy Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Taxa de Ocupação"
                value={`${occupancyData.overview?.occupancyRate?.toFixed(1) || 0}%`}
                color="blue"
                icon={<CalendarIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Slots Reservados"
                value={occupancyData.overview?.bookedSlots || 0}
                subtitle={`de ${occupancyData.overview?.totalSlots || 0} disponíveis`}
                color="green"
              />
              <MetricCard
                title="Slots Disponíveis"
                value={occupancyData.overview?.availableSlots || 0}
                color="yellow"
              />
              <MetricCard
                title="Média por Dia"
                value={occupancyData.overview?.averageSlotsPerDay?.toFixed(1) || 0}
                subtitle="slots por dia"
                color="gray"
              />
            </div>

            {/* Heatmap */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Mapa de Calor - Ocupação por Horário
              </h3>
              {occupancyData.heatmap && (
                <HeatmapChart
                  data={occupancyData.heatmap}
                  height={300}
                />
              )}
            </Card>

            {/* Day of Week Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Ocupação por Dia da Semana
              </h3>
              {occupancyData.dayOfWeekAnalysis && (
                <BarChart
                  data={{
                    labels: occupancyData.dayOfWeekAnalysis.map((item: any) => item.dayName),
                    datasets: [{
                      label: 'Taxa de Ocupação (%)',
                      data: occupancyData.dayOfWeekAnalysis.map((item: any) => item.occupancyRate),
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: '#3B82F6',
                      borderWidth: 1
                    }]
                  }}
                  height={300}
                />
              )}
            </Card>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Clientes Ativos"
                value={analyticsData.clients?.activeClients || 0}
                color="blue"
                icon={<UsersIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Novos Clientes"
                value={analyticsData.clients?.newClients || 0}
                color="green"
              />
              <MetricCard
                title="Taxa de Retenção"
                value={`${analyticsData.clients?.retentionRate?.toFixed(1) || 0}%`}
                color="yellow"
              />
              <MetricCard
                title="Sessões por Cliente"
                value={analyticsData.clients?.averageSessionsPerClient?.toFixed(1) || 0}
                subtitle="média"
                color="gray"
              />
            </div>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Clientes Ativos por Dia
              </h3>
              {analyticsData.clients?.clientsByDay && (
                <LineChart
                  data={{
                    labels: analyticsData.clients.clientsByDay.map((item: any) => 
                      format(new Date(item.date), 'dd/MM')
                    ),
                    datasets: [{
                      label: 'Clientes Únicos',
                      data: analyticsData.clients.clientsByDay.map((item: any) => item.clients),
                      borderColor: '#8B5CF6',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      fill: true,
                      tension: 0.4
                    }]
                  }}
                  height={400}
                />
              )}
            </Card>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <MetricCard
                title="Avaliação Média"
                value={analyticsData.performance?.rating?.toFixed(1) || '0.0'}
                color="green"
                icon={<ArrowTrendingUpIcon className="h-6 w-6" />}
              />
              <MetricCard
                title="Total de Avaliações"
                value={analyticsData.performance?.totalReviews || 0}
                color="blue"
              />
              <MetricCard
                title="NPS"
                value={`${analyticsData.performance?.nps?.toFixed(1) || 0}%`}
                color="yellow"
              />
              <MetricCard
                title="Taxa de No-Show"
                value={`${analyticsData.noshow?.noShowRate?.toFixed(1) || 0}%`}
                color="red"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribuição das Avaliações
                </h3>
                {analyticsData.performance?.ratingDistribution && (
                  <BarChart
                    data={{
                      labels: ['1 Estrela', '2 Estrelas', '3 Estrelas', '4 Estrelas', '5 Estrelas'],
                      datasets: [{
                        label: 'Quantidade',
                        data: [
                          analyticsData.performance.ratingDistribution[1] || 0,
                          analyticsData.performance.ratingDistribution[2] || 0,
                          analyticsData.performance.ratingDistribution[3] || 0,
                          analyticsData.performance.ratingDistribution[4] || 0,
                          analyticsData.performance.ratingDistribution[5] || 0
                        ],
                        backgroundColor: [
                          '#EF4444',
                          '#F97316',
                          '#F59E0B',
                          '#10B981',
                          '#059669'
                        ]
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Taxa de No-Show por Dia
                </h3>
                {analyticsData.noshow?.noShowByDay && (
                  <LineChart
                    data={{
                      labels: analyticsData.noshow.noShowByDay.map((item: any) => 
                        format(new Date(item.date), 'dd/MM')
                      ),
                      datasets: [{
                        label: 'Taxa de No-Show (%)',
                        data: analyticsData.noshow.noShowByDay.map((item: any) => item.rate),
                        borderColor: '#EF4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true,
                        tension: 0.4
                      }]
                    }}
                    height={300}
                  />
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}