'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Clock, 
  Calendar,
  Save,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Segunda-feira' },
  { value: 'TUESDAY', label: 'Terça-feira' },
  { value: 'WEDNESDAY', label: 'Quarta-feira' },
  { value: 'THURSDAY', label: 'Quinta-feira' },
  { value: 'FRIDAY', label: 'Sexta-feira' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' }
];

interface Availability {
  id?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  isNew?: boolean;
  isEditing?: boolean;
}

export default function TrainerAvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    fetchAvailability();
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

  const fetchAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      
      // Primeiro, buscar o perfil do trainer para pegar o ID
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

      // Buscar disponibilidades existentes
      const response = await fetch(`/api/trainers/${trainerId}/availability`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.availability) {
          // Convert API data to component format
          const availabilitySlots = data.data.availability.map((slot: any) => ({
            ...slot,
            isEditing: false,
            isNew: false,
          }));
          setAvailabilities(availabilitySlots);
        }
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      toast.error('Erro ao carregar disponibilidade');
    } finally {
      setLoading(false);
    }
  };

  const addAvailability = () => {
    const newAvailability: Availability = {
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '18:00',
      isActive: true,
      isNew: true,
      isEditing: true
    };
    setAvailabilities([...availabilities, newAvailability]);
  };

  const updateAvailability = (index: number, field: keyof Availability, value: any) => {
    const updated = [...availabilities];
    updated[index] = { ...updated[index], [field]: value };
    setAvailabilities(updated);
  };

  const deleteAvailability = (index: number) => {
    const updated = availabilities.filter((_, i) => i !== index);
    setAvailabilities(updated);
  };

  const toggleEdit = (index: number) => {
    const updated = [...availabilities];
    updated[index].isEditing = !updated[index].isEditing;
    setAvailabilities(updated);
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      
      // Primeiro, buscar o perfil do trainer para pegar o ID
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

      // Save all availability slots
      const dataToSave = availabilities.filter(av => av.isActive).map(av => ({
        dayOfWeek: av.dayOfWeek,
        startTime: av.startTime,
        endTime: av.endTime,
        isActive: av.isActive,
      }));

      const response = await fetch(`/api/trainers/${trainerId}/availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'x-user-role': user.role,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        throw new Error('Failed to save availability');
      }

      toast.success('Disponibilidade salva com sucesso!');
      
      // Marcar todos como não editáveis e não novos
      const updated = availabilities.map(av => ({
        ...av,
        isNew: false,
        isEditing: false
      }));
      setAvailabilities(updated);
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Erro ao salvar disponibilidade');
    } finally {
      setSaving(false);
    }
  };

  const getDayLabel = (dayValue: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayValue)?.label || dayValue;
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
                Gerenciar Disponibilidade
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure seus horários de atendimento semanais
              </p>
            </div>
            
            <Button 
              onClick={saveAvailability}
              disabled={saving || availabilities.length === 0}
              className="btn-primary"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>

        {/* Availability List */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary-500" />
                Horários Semanais
              </CardTitle>
              
              <Button 
                onClick={addAvailability}
                className="btn-outline btn-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Horário
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            {availabilities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">
                  Nenhuma disponibilidade configurada
                </p>
                <Button onClick={addAvailability} className="btn-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Primeiro Horário
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {availabilities.map((availability, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {availability.isEditing ? (
                      <>
                        <select
                          value={availability.dayOfWeek}
                          onChange={(e) => updateAvailability(index, 'dayOfWeek', e.target.value)}
                          className="input flex-1"
                        >
                          {DAYS_OF_WEEK.map(day => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <input
                            type="time"
                            value={availability.startTime}
                            onChange={(e) => updateAvailability(index, 'startTime', e.target.value)}
                            className="input w-32"
                          />
                          <span className="text-gray-500">até</span>
                          <input
                            type="time"
                            value={availability.endTime}
                            onChange={(e) => updateAvailability(index, 'endTime', e.target.value)}
                            className="input w-32"
                          />
                        </div>
                        
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={availability.isActive}
                            onChange={(e) => updateAvailability(index, 'isActive', e.target.checked)}
                            className="rounded text-primary-500"
                          />
                          <span className="text-sm">Ativo</span>
                        </label>
                        
                        <button
                          onClick={() => toggleEdit(index)}
                          className="p-2 text-success-600 hover:bg-success-100 rounded-lg"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => deleteAvailability(index)}
                          className="p-2 text-error-600 hover:bg-error-100 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-medium">{getDayLabel(availability.dayOfWeek)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>{availability.startTime} - {availability.endTime}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            availability.isActive 
                              ? 'bg-success-100 text-success-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {availability.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => toggleEdit(index)}
                          className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        
                        <button
                          onClick={() => deleteAvailability(index)}
                          className="p-2 text-error-600 hover:bg-error-100 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Helper Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Dica:</strong> Configure seus horários de atendimento para cada dia da semana. 
            Os clientes só poderão agendar dentro desses horários. Você pode adicionar múltiplos 
            períodos para o mesmo dia (ex: manhã e tarde).
          </p>
        </div>
      </div>
    </div>
  );
}