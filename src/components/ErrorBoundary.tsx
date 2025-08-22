'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    reset: () => void;
  }>;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error Boundary Caught:', error, errorInfo);
    
    // In production, you'd send this to Sentry or similar
    if (process.env.NODE_ENV === 'production') {
      // logErrorToService(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            reset={this.handleReset}
          />
        );
      }

      // Default error UI
      return <DefaultErrorFallback error={this.state.error} reset={this.handleReset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Ops! Algo deu errado
          </h1>
          
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            Encontramos um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
          </p>

          {/* Error Details (Development Only) */}
          {isDevelopment && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bug className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Detalhes do Erro (Dev Mode)
                </span>
              </div>
              <pre className="text-xs text-red-600 dark:text-red-400 overflow-auto max-h-40">
                {error.name}: {error.message}
                {error.stack && '\n\nStack Trace:\n' + error.stack}
              </pre>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={reset}
              variant="primary"
              fullWidth
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Tentar Novamente
            </Button>
            
            <Button
              onClick={() => window.location.href = '/'}
              variant="outline"
              fullWidth
              icon={<Home className="w-4 h-4" />}
            >
              Voltar ao Início
            </Button>
          </div>

          {/* Support Info */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Se o problema persistir, entre em contato com{' '}
              <a
                href="mailto:suporte@fitscheduler.com"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                suporte@fitscheduler.com
              </a>
            </p>
            
            {/* Error ID for support */}
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
              ID do Erro: {generateErrorId()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Generate a unique error ID for support reference
function generateErrorId(): string {
  return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
}

// Async Error Boundary for Suspense
export function AsyncErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={({ error, reset }) => (
        <div className="p-8 text-center">
          <div className="mb-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Erro ao carregar conteúdo
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <Button onClick={reset} size="sm">
            Tentar Novamente
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook to use error boundary programmatically
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: setError,
    clearError: () => setError(null),
  };
}