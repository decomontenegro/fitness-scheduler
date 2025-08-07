'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { Bell, Settings, Filter, Check, CheckCheck, Trash2, Volume2, VolumeX } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'payment' | 'reminder';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  pushNotifications: boolean;
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationContext();
  const [filter, setFilter] = useState<'all' | 'unread' | 'appointment' | 'message' | 'payment' | 'reminder'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    smsNotifications: false,
    whatsappNotifications: true,
    pushNotifications: true
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setPreferences({
        emailNotifications: user.emailNotifications ?? true,
        smsNotifications: user.smsNotifications ?? false,
        whatsappNotifications: user.whatsappNotifications ?? true,
        pushNotifications: user.pushNotifications ?? true
      });
    }
  }, [user]);

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'appointment':
      case 'message':
      case 'payment':
      case 'reminder':
        return notification.type === filter;
      default:
        return true;
    }
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'message': return '💬';
      case 'payment': return '💳';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment': return 'bg-blue-500';
      case 'message': return 'bg-green-500';
      case 'payment': return 'bg-yellow-500';
      case 'reminder': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate to relevant page
    switch (notification.type) {
      case 'message':
        window.location.href = '/messages';
        break;
      case 'appointment':
        if (notification.metadata?.appointmentId) {
          window.location.href = `/appointments/${notification.metadata.appointmentId}`;
        } else {
          window.location.href = '/appointments';
        }
        break;
      case 'payment':
        window.location.href = '/appointments';
        break;
      default:
        break;
    }
  };

  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPreferences)
      });

      if (response.ok) {
        setPreferences(newPreferences);
        // Show success message
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreferences({ ...preferences, pushNotifications: true });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Todas as notificações lidas'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                {soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </button>
              
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar todas como lidas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Preferences Panel */}
        {showPreferences && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferências de Notificação</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Email</h3>
                  <p className="text-sm text-gray-600">Receber notificações por email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.emailNotifications}
                    onChange={(e) => updatePreferences({ ...preferences, emailNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">WhatsApp</h3>
                  <p className="text-sm text-gray-600">Receber notificações no WhatsApp</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.whatsappNotifications}
                    onChange={(e) => updatePreferences({ ...preferences, whatsappNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Push (Navegador)</h3>
                  <p className="text-sm text-gray-600">Notificações no navegador</p>
                </div>
                <div className="flex items-center gap-2">
                  {Notification.permission === 'default' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Permitir
                    </button>
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications && Notification.permission === 'granted'}
                      onChange={(e) => updatePreferences({ ...preferences, pushNotifications: e.target.checked })}
                      disabled={Notification.permission !== 'granted'}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">SMS</h3>
                  <p className="text-sm text-gray-600">Apenas para urgências e lembretes importantes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.smsNotifications}
                    onChange={(e) => updatePreferences({ ...preferences, smsNotifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
            
            {[
              { value: 'all', label: 'Todas' },
              { value: 'unread', label: 'Não lidas' },
              { value: 'appointment', label: 'Agendamentos' },
              { value: 'message', label: 'Mensagens' },
              { value: 'payment', label: 'Pagamentos' },
              { value: 'reminder', label: 'Lembretes' }
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value as any)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === filterOption.value
                    ? 'bg-indigo-100 text-indigo-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
                {filterOption.value === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-2">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'Você não tem notificações no momento.'
                  : `Nenhuma notificação encontrada para o filtro "${filter}".`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-lg shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
                  notification.isRead ? 'opacity-75' : 'border-l-4 border-l-indigo-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${getNotificationColor(notification.type)}`}>
                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className={`font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                            title="Marcar como lida"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                    
                    <div className="mt-2 text-xs text-gray-400">
                      {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}