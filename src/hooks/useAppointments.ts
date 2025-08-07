'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface Appointment {
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
}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createAppointment: (data: CreateAppointmentData) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<void>;
}

interface CreateAppointmentData {
  trainerId: string;
  clientId: string;
  serviceId?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  price: number;
}

export function useAppointments(filters?: {
  status?: string;
  date?: string;
  limit?: number;
}): UseAppointmentsReturn {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.date) params.append('date', filters.date);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await fetch(`/api/appointments?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar agendamentos');
      }

      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (data: CreateAppointmentData) => {
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao criar agendamento');
      }

      // Refresh appointments list
      await fetchAppointments();
    } catch (err) {
      throw err;
    }
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar agendamento');
      }

      // Update local state
      setAppointments(prev => 
        prev.map(apt => 
          apt.id === id ? { ...apt, status } : apt
        )
      );
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user, filters]);

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
  };
}