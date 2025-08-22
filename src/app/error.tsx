'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page Error:', error);
    
    // In production, send to error tracking service
    if (!isDevelopment) {
      // sendToSentry(error);
    }
  }, [error, isDevelopment]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg w-full"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
              Algo não saiu como esperado
            </h1>
            
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Encontramos um problema ao processar sua solicitação. 
              Nosso time foi notificado e está trabalhando para resolver.
            </p>

            {/* Error Details for Development */}
            {isDevelopment && error.message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6"
              >
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                        Detalhes do Erro (Desenvolvimento)
                      </p>
                      <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap break-all">
                        {error.message}
                      </pre>
                      {error.digest && (
                        <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                          Digest: {error.digest}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button
                onClick={reset}
                variant="primary"
                fullWidth
                icon={<RefreshCw className="w-4 h-4" />}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                Tentar Novamente
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="ghost"
                fullWidth
                icon={<Home className="w-4 h-4" />}
              >
                Voltar ao Início
              </Button>
            </div>

            {/* Help text */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                Código do erro: {error.digest || generateErrorCode()}
              </p>
            </div>
          </div>
        </div>

        {/* Additional help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Precisa de ajuda?{' '}
            <a
              href="/contact"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Entre em contato
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

function generateErrorCode(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase();
}