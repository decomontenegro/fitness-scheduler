'use client';

import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  MessageSquare,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AppointmentCardProps {
  appointment: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
    price: number;
    trainer?: {
      user: {
        name: string;
        avatar?: string;
      };
    };
    client?: {
      user: {
        name: string;
        avatar?: string;
      };
    };
    service?: {
      name: string;
      duration: number;
    };
  };
  userRole: 'CLIENT' | 'TRAINER';
  onAction?: (action: string, appointmentId: string) => void;
  compact?: boolean;
}

const statusConfig = {
  PENDING: {
    label: 'Pendente',
    color: 'text-warning-600 bg-warning-100 dark:text-warning-400 dark:bg-warning-900/30',
    icon: AlertCircle,
  },
  CONFIRMED: {
    label: 'Confirmado',
    color: 'text-success-600 bg-success-100 dark:text-success-400 dark:bg-success-900/30',
    icon: CheckCircle,
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelado',
    color: 'text-danger-600 bg-danger-100 dark:text-danger-400 dark:bg-danger-900/30',
    icon: XCircle,
  },
};

export function AppointmentCard({ 
  appointment, 
  userRole, 
  onAction,
  compact = false 
}: AppointmentCardProps) {
  const status = statusConfig[appointment.status as keyof typeof statusConfig] || statusConfig.PENDING;
  const StatusIcon = status.icon;
  
  const otherUser = userRole === 'TRAINER' ? appointment.client : appointment.trainer;
  
  const appointmentDate = new Date(appointment.startTime);
  const isToday = new Date().toDateString() === appointmentDate.toDateString();
  const isPast = appointmentDate < new Date();
  const isUpcoming = !isPast && !isToday;

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {otherUser?.user.name.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {otherUser?.user.name || 'Cliente não encontrado'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {format(appointmentDate, 'HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-xs px-2 py-1 rounded-full', status.color)}>
                {status.label}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {otherUser?.user.name.charAt(0) || '?'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {otherUser?.user.name || 'Cliente não encontrado'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {appointment.service?.name || 'Treino personalizado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon className="h-4 w-4" />
            <span className={cn('text-sm px-3 py-1 rounded-full', status.color)}>
              {status.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4" />
            <span>
              {format(appointmentDate, 'dd MMM yyyy', { locale: ptBR })}
              {isToday && <span className="ml-1 text-primary-600 font-medium">(Hoje)</span>}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>
              {format(new Date(appointment.startTime), 'HH:mm', { locale: ptBR })} - {' '}
              {format(new Date(appointment.endTime), 'HH:mm', { locale: ptBR })}
            </span>
          </div>
        </div>

        {appointment.notes && (
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Observações:</strong> {appointment.notes}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
            <span>R$ {appointment.price.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {appointment.status === 'PENDING' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction?.('cancel', appointment.id)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAction?.('confirm', appointment.id)}
                >
                  Confirmar
                </Button>
              </>
            )}
            
            {appointment.status === 'CONFIRMED' && isToday && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction?.('complete', appointment.id)}
              >
                Marcar como Concluído
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAction?.('message', appointment.id)}
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}