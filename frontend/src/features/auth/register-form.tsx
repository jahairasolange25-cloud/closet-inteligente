'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export function RegisterForm() {
  const { register: authRegister, isLoading, error, clearError } = useAuthStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const password = watch('password', '');
  const strength = [/[A-Z]/, /[a-z]/, /[0-9]/, /.{8,}/].filter((r) => r.test(password)).length;

  const onSubmit = async (data: RegisterFormData) => {
    clearError();
    try {
      await authRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        acceptTerms: data.acceptTerms,
        consentAI: data.consentAI,
      });
      router.push('/');
    } catch {
      // error set in store
    }
  };

  return (
    <Card padding="lg" className="w-full animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">
          Crear Cuenta
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Empieza a organizar tu armario hoy
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-lg bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 dark:bg-error-900/20 dark:border-error-800 dark:text-error-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        <Input label="Nombre" required autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" required autoComplete="email" error={errors.email?.message} {...register('email')} />
        <div>
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="new-password"
            error={errors.password?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
            {...register('password')}
          />
          {password && (
            <div className="mt-2 flex gap-1" aria-label={`Seguridad: ${strength}/4`}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < strength
                      ? strength <= 1 ? 'bg-error-500' : strength <= 2 ? 'bg-warning-500' : strength <= 3 ? 'bg-info-500' : 'bg-success-500'
                      : 'bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        <Input
          label="Confirmar contraseña"
          type="password"
          required
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="flex flex-col gap-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              {...register('acceptTerms')}
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Acepto los{' '}
              <Link href="/terms" className="text-primary-600 hover:underline">términos y condiciones</Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="text-xs text-error-600" role="alert">{errors.acceptTerms.message}</p>
          )}

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              {...register('consentAI')}
            />
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Acepto el uso de IA para mejorar mis recomendaciones (opcional)
            </span>
          </label>
        </div>

        <Button type="submit" loading={isLoading} className="w-full" size="lg">
          Crear Cuenta
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">
          Inicia sesión
        </Link>
      </p>
    </Card>
  );
}
