'use client';

import React from 'react';
import { toast as hotToast, Toaster, Toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Loader2,
  X,
  CheckCheck,
  AlertTriangle,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading' | 'promise';

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

// Icon mapping
const icons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  loading: <Loader2 className="w-5 h-5 animate-spin" />,
};

// Color mapping
const colors = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
  info: 'bg-blue-500',
  loading: 'bg-gray-500',
};

// Enhanced toast function
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    hotToast.custom((t) => (
      <ToastContent
        type="success"
        message={message}
        options={options}
        toastInstance={t}
      />
    ), {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
    });
  },
  
  error: (message: string, options?: ToastOptions) => {
    hotToast.custom((t) => (
      <ToastContent
        type="error"
        message={message}
        options={options}
        toastInstance={t}
      />
    ), {
      duration: options?.duration || 6000,
      position: options?.position || 'top-right',
    });
  },
  
  warning: (message: string, options?: ToastOptions) => {
    hotToast.custom((t) => (
      <ToastContent
        type="warning"
        message={message}
        options={options}
        toastInstance={t}
      />
    ), {
      duration: options?.duration || 5000,
      position: options?.position || 'top-right',
    });
  },
  
  info: (message: string, options?: ToastOptions) => {
    hotToast.custom((t) => (
      <ToastContent
        type="info"
        message={message}
        options={options}
        toastInstance={t}
      />
    ), {
      duration: options?.duration || 4000,
      position: options?.position || 'top-right',
    });
  },
  
  loading: (message: string, options?: ToastOptions) => {
    return hotToast.custom((t) => (
      <ToastContent
        type="loading"
        message={message}
        options={options}
        toastInstance={t}
      />
    ), {
      duration: options?.duration || Infinity,
      position: options?.position || 'top-right',
    });
  },
  
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return hotToast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        position: options?.position || 'top-right',
        style: {
          minWidth: '250px',
        },
      }
    );
  },
  
  dismiss: (toastId?: string) => {
    hotToast.dismiss(toastId);
  },
  
  // Custom notification style toast
  notification: (options: {
    title: string;
    message: string;
    avatar?: string;
    action?: () => void;
    actionLabel?: string;
  }) => {
    hotToast.custom((t) => (
      <NotificationToast {...options} toastInstance={t} />
    ), {
      duration: 5000,
      position: 'top-right',
    });
  },
};

// Toast content component
function ToastContent({
  type,
  message,
  options,
  toastInstance,
}: {
  type: ToastType;
  message: string;
  options?: ToastOptions;
  toastInstance: Toast;
}) {
  return (
    <AnimatePresence>
      {toastInstance.visible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.3 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className={`
            max-w-sm w-full bg-white dark:bg-gray-800 shadow-2xl rounded-xl p-4
            pointer-events-auto flex ring-1 ring-black ring-opacity-5
            transform transition-all duration-300
          `}
        >
          <div className="flex items-start">
            {/* Icon */}
            <div className={`
              flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full
              ${colors[type]} text-white
            `}>
              {options?.icon || icons[type]}
            </div>
            
            {/* Content */}
            <div className="ml-3 flex-1 pt-0.5">
              {options?.title && (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {options.title}
                </p>
              )}
              <p className={`text-sm text-gray-600 dark:text-gray-400 ${options?.title ? 'mt-1' : ''}`}>
                {message}
              </p>
              {options?.description && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  {options.description}
                </p>
              )}
              
              {/* Action Button */}
              {options?.action && (
                <button
                  onClick={options.action.onClick}
                  className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  {options.action.label}
                </button>
              )}
            </div>
            
            {/* Close Button */}
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => hotToast.dismiss(toastInstance.id)}
                className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <span className="sr-only">Close</span>
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Notification style toast
function NotificationToast({
  title,
  message,
  avatar,
  action,
  actionLabel,
  toastInstance,
}: {
  title: string;
  message: string;
  avatar?: string;
  action?: () => void;
  actionLabel?: string;
  toastInstance: Toast;
}) {
  return (
    <AnimatePresence>
      {toastInstance.visible && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="max-w-sm w-full bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-4 pointer-events-auto"
        >
          <div className="flex items-start">
            {/* Avatar or Icon */}
            <div className="flex-shrink-0">
              {avatar ? (
                <img
                  className="h-10 w-10 rounded-full"
                  src={avatar}
                  alt=""
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
              )}
            </div>
            
            {/* Content */}
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {title}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
              
              {/* Actions */}
              {action && (
                <div className="mt-3 flex space-x-3">
                  <button
                    onClick={() => {
                      action();
                      hotToast.dismiss(toastInstance.id);
                    }}
                    className="text-sm font-medium text-primary-600 hover:text-primary-500"
                  >
                    {actionLabel || 'View'}
                  </button>
                  <button
                    onClick={() => hotToast.dismiss(toastInstance.id)}
                    className="text-sm font-medium text-gray-500 hover:text-gray-600"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
            
            {/* Close */}
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={() => hotToast.dismiss(toastInstance.id)}
                className="rounded-md inline-flex text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Progress Toast
export function ProgressToast({
  message,
  progress,
}: {
  message: string;
  progress: number;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 min-w-[300px]">
      <div className="flex items-center mb-2">
        <Loader2 className="w-5 h-5 animate-spin text-primary-600 mr-3" />
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {message}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          className="bg-primary-600 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-right">{progress}%</p>
    </div>
  );
}

// Enhanced Toaster Provider
export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{
        top: 80,
      }}
      toastOptions={{
        duration: 5000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
        },
      }}
    />
  );
}