'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SimpleBookingFlow } from '@/components/booking/SimpleBookingFlow';
import { PageHeader } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Calendar } from 'lucide-react';

export default function BookingPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Agendar Sessão"
          description="Escolha seu trainer e agende sua próxima sessão de treino"
          showBreadcrumbs={true}
          actions={
            <Button
              onClick={() => router.push(user?.role === 'TRAINER' ? '/dashboard/trainer' : '/dashboard/client')}
              variant="outline"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Voltar ao Dashboard
            </Button>
          }
        />
        
        <SimpleBookingFlow />
      </div>
    </div>
  );
}