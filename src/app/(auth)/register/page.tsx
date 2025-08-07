'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Dumbbell, Mail, Lock, User, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string(),
  phone: z.string().optional(),
  role: z.enum(['CLIENT', 'TRAINER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'CLIENT',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...registerData } = data;
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/login');
      } else {
        setError(result.error || 'Erro ao criar conta');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Crie sua conta</CardTitle>
          <CardDescription>Comece sua jornada fitness hoje</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 bg-danger-50 border border-danger-200 text-danger-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="relative">
                <input
                  {...register('role')}
                  type="radio"
                  value="CLIENT"
                  className="sr-only peer"
                />
                <div className="p-3 border-2 rounded-lg cursor-pointer text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20">
                  <p className="font-medium">Sou Cliente</p>
                  <p className="text-xs text-gray-500">Quero treinar</p>
                </div>
              </label>

              <label className="relative">
                <input
                  {...register('role')}
                  type="radio"
                  value="TRAINER"
                  className="sr-only peer"
                />
                <div className="p-3 border-2 rounded-lg cursor-pointer text-center transition-all peer-checked:border-primary-500 peer-checked:bg-primary-50 dark:peer-checked:bg-primary-900/20">
                  <p className="font-medium">Sou Personal</p>
                  <p className="text-xs text-gray-500">Ofereço treinos</p>
                </div>
              </label>
            </div>

            <Input
              {...register('name')}
              type="text"
              label="Nome completo"
              placeholder="João Silva"
              icon={<User className="h-5 w-5" />}
              error={errors.name?.message}
            />

            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="seu@email.com"
              icon={<Mail className="h-5 w-5" />}
              error={errors.email?.message}
            />

            <Input
              {...register('phone')}
              type="tel"
              label="Telefone (opcional)"
              placeholder="(11) 99999-9999"
              icon={<Phone className="h-5 w-5" />}
              error={errors.phone?.message}
            />

            <Input
              {...register('password')}
              type="password"
              label="Senha"
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              error={errors.password?.message}
            />

            <Input
              {...register('confirmPassword')}
              type="password"
              label="Confirmar senha"
              placeholder="••••••••"
              icon={<Lock className="h-5 w-5" />}
              error={errors.confirmPassword?.message}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              Criar conta
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}