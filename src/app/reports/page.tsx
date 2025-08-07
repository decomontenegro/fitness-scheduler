'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'
import { format, subDays, subMonths } from 'date-fns'
import toast from 'react-hot-toast'

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: 'financial' | 'clients' | 'occupancy' | 'performance'
  icon: any
  color: string
}

interface ScheduledReport {
  id: string
  name: string
  frequency: string
  nextGeneration: string
  status: 'active' | 'paused'
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'financial',
    name: 'Relatório Financeiro',
    description: 'Análise completa de receitas, transações e performance financeira',
    type: 'financial',
    icon: CurrencyDollarIcon,
    color: 'green'
  },
  {
    id: 'clients',
    name: 'Relatório de Clientes',
    description: 'Dados dos clientes, frequência, retenção e análise comportamental',
    type: 'clients',
    icon: UsersIcon,
    color: 'blue'
  },
  {
    id: 'occupancy',
    name: 'Relatório de Ocupação',
    description: 'Taxa de ocupação, horários de pico e análise de disponibilidade',
    type: 'occupancy',
    icon: CalendarIcon,
    color: 'yellow'
  },
  {
    id: 'performance',
    name: 'Relatório de Desempenho',
    description: 'Avaliações, NPS, taxa de cancelamento e satisfação dos clientes',
    type: 'performance',
    icon: ChartBarIcon,
    color: 'purple'
  }
]

export default function ReportsPage() {
  const { user, token } = useAuth()
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [generating, setGenerating] = useState(false)
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([])
  const [reportHistory, setReportHistory] = useState<any[]>([])
  const [filters, setFilters] = useState({
    period: '30d',
    startDate: '',
    endDate: '',
    trainerId: '',
    includeCharts: true
  })

  useEffect(() => {
    fetchScheduledReports()
    fetchReportHistory()
  }, [])

  const fetchScheduledReports = async () => {
    // Mock data - implementar API real posteriormente
    setScheduledReports([
      {
        id: '1',
        name: 'Relatório Financeiro Mensal',
        frequency: 'monthly',
        nextGeneration: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy'),
        status: 'active'
      },
      {
        id: '2',
        name: 'Relatório de Clientes Semanal',
        frequency: 'weekly',
        nextGeneration: format(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy'),
        status: 'active'
      }
    ])
  }

  const fetchReportHistory = async () => {
    // Mock data - implementar API real posteriormente
    setReportHistory([
      {
        id: '1',
        name: 'Relatório Financeiro - Janeiro 2024',
        type: 'financial',
        generatedAt: subDays(new Date(), 5),
        status: 'completed',
        downloadUrl: '#'
      },
      {
        id: '2',
        name: 'Relatório de Clientes - Janeiro 2024',
        type: 'clients',
        generatedAt: subDays(new Date(), 3),
        status: 'completed',
        downloadUrl: '#'
      },
      {
        id: '3',
        name: 'Relatório de Ocupação - Janeiro 2024',
        type: 'occupancy',
        generatedAt: subDays(new Date(), 1),
        status: 'processing',
        downloadUrl: null
      }
    ])
  }

  const generateReport = async (format: 'pdf' | 'excel') => {
    if (!selectedTemplate) return

    try {
      setGenerating(true)

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportType: selectedTemplate.type,
          format,
          period: filters.period,
          filters,
          includeCharts: filters.includeCharts
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar relatório')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Relatório gerado com sucesso!')
      
      // Refresh history
      fetchReportHistory()

    } catch (error) {
      console.error('Erro ao gerar relatório:', error)
      toast.error('Erro ao gerar relatório')
    } finally {
      setGenerating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'processing':
        return 'Processando'
      case 'error':
        return 'Erro'
      default:
        return 'Pendente'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Central de Relatórios</h1>
          <p className="text-gray-500 mt-2">Gere e gerencie relatórios detalhados do seu negócio</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Generation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Templates */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Tipos de Relatório</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`
                      p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                      ${selectedTemplate?.id === template.id
                        ? `border-${template.color}-500 bg-${template.color}-50`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-${template.color}-100`}>
                        <template.icon className={`h-6 w-6 text-${template.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Configuration */}
            {selectedTemplate && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Configurações do Relatório</h2>
                
                <div className="space-y-4">
                  {/* Period */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Período
                      </label>
                      <select
                        value={filters.period}
                        onChange={(e) => setFilters({ ...filters, period: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
                      >
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="3m">Últimos 3 meses</option>
                        <option value="6m">Últimos 6 meses</option>
                        <option value="1y">Último ano</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Opções
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.includeCharts}
                          onChange={(e) => setFilters({ ...filters, includeCharts: e.target.checked })}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Incluir gráficos (apenas PDF)</span>
                      </label>
                    </div>
                  </div>

                  {/* Generate Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <Button
                      onClick={() => generateReport('pdf')}
                      disabled={generating}
                      className="flex-1"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      {generating ? 'Gerando...' : 'Gerar PDF'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateReport('excel')}
                      disabled={generating}
                      className="flex-1"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      {generating ? 'Gerando...' : 'Gerar Excel'}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Scheduled Reports */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Agendados</h3>
              
              {scheduledReports.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum relatório agendado</p>
              ) : (
                <div className="space-y-3">
                  {scheduledReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{report.name}</p>
                        <p className="text-xs text-gray-500">
                          Próximo: {report.nextGeneration}
                        </p>
                      </div>
                      <span className={`
                        px-2 py-1 text-xs rounded-full
                        ${report.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      `}>
                        {report.status === 'active' ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full mt-4">
                Configurar Agendamentos
              </Button>
            </Card>

            {/* Recent Reports */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Relatórios Recentes</h3>
              
              {reportHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum relatório gerado</p>
              ) : (
                <div className="space-y-3">
                  {reportHistory.slice(0, 5).map((report) => (
                    <div key={report.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(report.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {report.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(report.generatedAt, 'dd/MM/yyyy HH:mm')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getStatusText(report.status)}
                        </p>
                      </div>
                      {report.status === 'completed' && report.downloadUrl && (
                        <Button size="sm" variant="outline">
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Button variant="outline" size="sm" className="w-full mt-4">
                Ver Todos os Relatórios
              </Button>
            </Card>

            {/* Tips */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dicas</h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Use o formato PDF para relatórios com gráficos e visualizações</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Excel é melhor para análise detalhada dos dados</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p>Configure relatórios automáticos para economia de tempo</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}