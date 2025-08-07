'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'payment' | 'reminder';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export default function NotificationIcon() {
  const { notifications, unreadCount, markAsRead, isConnected } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'message': return '💬';
      case 'payment': return '💳';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

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

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ''}`}
      >
        <Bell className="h-5 w-5" />
        
        {/* Connection status dot */}
        <div className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              <div className="flex items-center gap-2">
                {!isConnected && (
                  <span className="text-xs text-red-600">Desconectado</span>
                )}
                <Link
                  href="/notifications"
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                  onClick={() => setIsOpen(false)}
                >
                  Ver todas
                </Link>
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </p>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="py-2">
                {recentNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-3 hover:bg-gray-50 border-l-2 transition-colors ${
                      notification.isRead 
                        ? 'border-l-transparent' 
                        : 'border-l-indigo-500 bg-indigo-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          notification.isRead ? 'text-gray-600' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs mt-1 line-clamp-2 ${
                          notification.isRead ? 'text-gray-500' : 'text-gray-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.createdAt), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <Link
                href="/notifications"
                className="block text-center text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                onClick={() => setIsOpen(false)}
              >
                Ver todas as notificações
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}