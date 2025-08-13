'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Package,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Clock,
  DollarSign,
  ArrowLeft,
  Check
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Service {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
  isNew?: boolean;
  isEditing?: boolean;
}

export default function TrainerServicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [user, setUser] = useState<any>(null);
  const [trainerId, setTrainerId] = useState<string>('');

  useEffect(() => {
    checkAuth();
    fetchServices();
  }, []);

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

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      
      // Buscar o perfil do trainer para pegar o ID
      const profileResponse = await fetch('/api/users/profile', {
        headers: {
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      const trainerId = profileData.trainerProfile?.id;

      if (!trainerId) {
        throw new Error('Trainer profile not found');
      }

      setTrainerId(trainerId);

      // Buscar serviços do trainer
      const response = await fetch(`/api/trainers/${trainerId}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const servicesData = data.data.services || data.data;
          setServices(Array.isArray(servicesData) ? servicesData.map((service: any) => ({
            ...service,
            isEditing: false,
            isNew: false
          })) : []);
        }
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const addService = () => {
    const newService: Service = {
      name: 'Novo Serviço',
      description: '',
      duration: 60,
      price: 100,
      isActive: true,
      isNew: true,
      isEditing: true
    };
    setServices([...services, newService]);
  };

  const updateService = (index: number, field: keyof Service, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const deleteService = async (index: number) => {
    const service = services[index];
    
    if (!service.isNew && service.id) {
      // Se não é novo, precisa deletar do banco
      if (!confirm('Tem certeza que deseja excluir este serviço?')) {
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/trainers/${trainerId}/services?serviceId=${service.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-user-id': user.id,
            'x-user-role': user.role,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete service');
        }

        toast.success('Serviço excluído com sucesso!');
      } catch (error) {
        toast.error('Erro ao excluir serviço');
        return;
      }
    }
    
    const updated = services.filter((_, i) => i !== index);
    setServices(updated);
  };

  const toggleEdit = (index: number) => {
    const updated = [...services];
    updated[index].isEditing = !updated[index].isEditing;
    setServices(updated);
  };

  const saveService = async (index: number) => {
    const service = services[index];
    
    if (!service.name || service.duration <= 0 || service.price < 0) {
      toast.error('Preencha todos os campos corretamente');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const method = service.isNew ? 'POST' : 'PUT';
      const url = service.isNew 
        ? `/api/trainers/${trainerId}/services`
        : `/api/trainers/${trainerId}/services?serviceId=${service.id}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify({
          name: service.name,
          description: service.description,
          duration: service.duration,
          price: service.price,
          isActive: service.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save service');
      }

      const data = await response.json();
      toast.success('Serviço salvo com sucesso!');
      
      const updated = [...services];
      updated[index] = {
        ...data.data,
        isNew: false,
        isEditing: false
      };
      setServices(updated);
    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Erro ao salvar serviço');
    }
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
                Gerenciar Serviços
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure os serviços que você oferece aos seus clientes
              </p>
            </div>
            
            <Button 
              onClick={addService}
              className="btn-primary"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar Serviço
            </Button>
          </div>
        </div>

        {/* Services Grid */}
        {services.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Nenhum serviço cadastrado ainda
              </p>
              <Button onClick={addService} className="btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeiro Serviço
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="hover-lift">
                <CardHeader>
                  {service.isEditing ? (
                    <input
                      type="text"
                      value={service.name}
                      onChange={(e) => updateService(index, 'name', e.target.value)}
                      className="input font-semibold text-lg"
                      placeholder="Nome do serviço"
                    />
                  ) : (
                    <CardTitle className="flex items-center justify-between">
                      <span>{service.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        service.isActive 
                          ? 'bg-success-100 text-success-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {service.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </CardTitle>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {service.isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Descrição
                        </label>
                        <textarea
                          value={service.description}
                          onChange={(e) => updateService(index, 'description', e.target.value)}
                          className="input min-h-[80px]"
                          placeholder="Descreva o serviço..."
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Duração (min)
                          </label>
                          <input
                            type="number"
                            value={service.duration}
                            onChange={(e) => updateService(index, 'duration', parseInt(e.target.value))}
                            className="input"
                            min="15"
                            step="15"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            <DollarSign className="w-4 h-4 inline mr-1" />
                            Preço (R$)
                          </label>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) => updateService(index, 'price', parseFloat(e.target.value))}
                            className="input"
                            min="0"
                            step="10"
                          />
                        </div>
                      </div>
                      
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={service.isActive}
                          onChange={(e) => updateService(index, 'isActive', e.target.checked)}
                          className="rounded text-primary-500"
                        />
                        <span className="text-sm">Serviço ativo</span>
                      </label>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => saveService(index)}
                          className="btn-primary flex-1"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Salvar
                        </Button>
                        <Button
                          onClick={() => {
                            if (service.isNew) {
                              deleteService(index);
                            } else {
                              toggleEdit(index);
                            }
                          }}
                          className="btn-outline"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {service.description || 'Sem descrição'}
                      </p>
                      
                      <div className="flex items-center justify-between py-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">{service.duration} min</span>
                        </div>
                        <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                          {formatCurrency(service.price)}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => toggleEdit(index)}
                          className="btn-outline flex-1"
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          onClick={() => deleteService(index)}
                          className="text-error-600 hover:bg-error-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Helper Text */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Dica:</strong> Configure diferentes tipos de serviços com preços e durações variadas. 
            Os clientes poderão escolher entre os serviços ativos ao fazer um agendamento.
          </p>
        </div>
      </div>
    </div>
  );
}