'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Dumbbell, Mail, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        // Store user data in localStorage
        const token = result.accessToken || result.token;
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('token', token);  // Save as 'token' for compatibility
        localStorage.setItem('accessToken', token);  // Also save as accessToken
        
        // Set cookie for middleware
        document.cookie = `auth-token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        
        // Handle 2FA if required
        if (result.requiresTwoFactor) {
          // Redirect to 2FA verification page
          router.push('/auth/2fa-verify');
          return;
        }
        
        // Use Next.js router instead of window.location to preserve state
        setTimeout(() => {
          if (result.user.role === 'TRAINER') {
            router.push('/dashboard/trainer');
          } else {
            router.push('/dashboard/client');
          }
        }, 100);
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400/10 to-secondary-400/10 animate-gradient"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-primary-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-secondary-400/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: "2s" }}></div>
      
      <Card variant="glass" animated className="w-full max-w-md relative z-10 backdrop-blur-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center animate-float shadow-xl shadow-primary-500/30">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl gradient-text">Bem-vindo de volta!</CardTitle>
          <CardDescription>Entre na sua conta para continuar</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="seu@email.com"
              icon={<Mail className="h-5 w-5" />}
              error={errors.email?.message}
              variant="modern"
            />

            <Input
              {...register('password')}
              type="password"
              label="Senha"
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              error={errors.password?.message}
              variant="modern"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input 
                  {...register('rememberMe')}
                  type="checkbox" 
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                />
                <span className="text-sm text-gray-600">Manter conectado</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Esqueceu a senha?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={loading}
              variant="gradient"
              magnetic
              glow
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Cadastre-se grátis
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}