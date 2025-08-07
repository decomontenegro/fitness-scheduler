'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';

interface NotificationContextType {
  socket: Socket | null;
  isConnected: boolean;
  unreadCount: number;
  notifications: Notification[];
  requestPermission: () => Promise<boolean>;
  subscribeToPush: () => Promise<void>;
  playNotificationSound: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'appointment' | 'message' | 'payment' | 'reminder';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) return;

    // Get the current host without hardcoding the port
    const socketUrl = typeof window !== 'undefined' 
      ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
      : 'http://localhost:3001';
    
    const socketInstance = io(socketUrl, {
      auth: {
        token
      }
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to notification server');
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from notification server');
    });

    // Listen for new notifications
    socketInstance.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      showToastNotification(notification);
      
      // Play sound if enabled
      if (user.pushNotifications) {
        playNotificationSound();
      }

      // Show browser notification if permitted
      if (Notification.permission === 'granted' && user.pushNotifications) {
        showBrowserNotification(notification);
      }
    });

    // Listen for message notifications
    socketInstance.on('message:received', (message: any) => {
      const notification: Notification = {
        id: message.id,
        title: 'Nova mensagem',
        message: `${message.sender.name}: ${message.content}`,
        type: 'message',
        isRead: false,
        createdAt: message.createdAt,
        metadata: { messageId: message.id, senderId: message.senderId }
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showToastNotification(notification);
      playNotificationSound();
    });

    // Listen for appointment updates
    socketInstance.on('appointment:updated', (appointment: any) => {
      const notification: Notification = {
        id: `appointment-${appointment.id}`,
        title: 'Agendamento atualizado',
        message: `Seu agendamento foi ${appointment.status.toLowerCase()}`,
        type: 'appointment',
        isRead: false,
        createdAt: new Date().toISOString(),
        metadata: { appointmentId: appointment.id }
      };
      
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      showToastNotification(notification);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, token]);

  // Load existing notifications
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
  }, [user]);

  const showToastNotification = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type);
    
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
                      max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto 
                      flex ring-1 ring-black ring-opacity-5`}>
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-xl">{icon}</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {notification.message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 
                      flex items-center justify-center text-sm font-medium text-indigo-600 
                      hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Fechar
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-right'
    });
  };

  const showBrowserNotification = (notification: Notification) => {
    if (Notification.permission !== 'granted') return;

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      renotify: true
    });

    browserNotification.onclick = () => {
      window.focus();
      browserNotification.close();
      
      // Navigate to relevant page based on notification type
      if (notification.type === 'message') {
        window.location.href = '/messages';
      } else if (notification.type === 'appointment') {
        window.location.href = '/appointments';
      }
    };
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'message': return '💬';
      case 'payment': return '💳';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Fallback to system notification sound
        console.log('Could not play notification sound');
      });
    } catch (error) {
      console.log('Notification sound not available');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const subscribeToPush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      // Save subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      });

      console.log('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const value: NotificationContextType = {
    socket,
    isConnected,
    unreadCount,
    notifications,
    requestPermission,
    subscribeToPush,
    playNotificationSound,
    markAsRead,
    markAllAsRead
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}