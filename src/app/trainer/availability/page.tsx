'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AvailabilityCalendar } from '@/components/trainer/AvailabilityCalendar';
import { PageHeader } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Calendar, Settings } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { CalendarSkeleton } from '@/components/ui/SkeletonLoaders';

export default function TrainerAvailabilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trainerId, setTrainerId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
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

      // Fetch trainer profile to get trainer ID
      const response = await fetch('/api/users/profile', {
        headers: {
          'x-user-id': userData.id,
          'x-user-role': userData.role,
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        const trainerProfileId = profileData.trainerProfile?.id;
        
        if (trainerProfileId) {
          setTrainerId(trainerProfileId);
        } else {
          // Create trainer profile if it doesn't exist
          const createResponse = await fetch('/api/users/trainer-profile', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-user-id': userData.id,
              'x-user-role': userData.role,
            },
          });

          if (createResponse.ok) {
            const newProfile = await createResponse.json();
            setTrainerId(newProfile.id);
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (availability: any[]) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/trainers/${trainerId}/availability/calendar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ availability }),
      });

      if (!response.ok) {
        throw new Error('Failed to save availability');
      }

      toast.success('Disponibilidade salva com sucesso!');
    } catch (error) {
      console.error('Error saving availability:', error);
      toast.error('Erro ao salvar disponibilidade');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <PageHeader
            title="Gerenciar Disponibilidade"
            description="Configure seus horários de atendimento"
            showBreadcrumbs={true}
            actions={
              <Button
                onClick={() => router.push('/dashboard/trainer')}
                variant="outline"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            }
          />
          <CalendarSkeleton />
        </div>
      </div>
    );
  }

  if (!trainerId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Perfil não encontrado</h2>
          <p className="text-gray-600 mb-4">Não foi possível carregar seu perfil de trainer</p>
          <Button onClick={() => router.push('/dashboard/trainer')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Gerenciar Disponibilidade"
          description="Configure seus horários de atendimento semanais"
          showBreadcrumbs={true}
          actions={
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/trainer/settings')}
                variant="outline"
                icon={<Settings className="w-4 h-4" />}
              >
                Configurações
              </Button>
              <Button
                onClick={() => router.push('/dashboard/trainer')}
                variant="outline"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Voltar
              </Button>
            </div>
          }
        />
        
        <AvailabilityCalendar 
          trainerId={trainerId}
          onSave={handleSave}
        />
        
        {/* Help Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold">Configuração Rápida</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Clique em qualquer dia da semana para adicionar seus horários disponíveis. 
              Você pode copiar a configuração de um dia para todos os dias úteis.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold">Horários Flexíveis</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configure múltiplos slots por dia, defina o número máximo de atendimentos 
              simultâneos e bloqueie dias específicos quando necessário.
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold">Sincronização Automática</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Suas alterações são salvas automaticamente. Os clientes verão apenas 
              os horários disponíveis ao tentar agendar uma sessão.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}