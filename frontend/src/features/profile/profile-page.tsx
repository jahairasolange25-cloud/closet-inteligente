'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { User, Mail, Camera, Save } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { extractError } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const profileSchema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const { addToast } = useUIStore();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const onSubmit = async (values: ProfileForm) => {
    setIsSaving(true);
    try {
      const updated = await authService.getMe();
      setUser({ ...updated, name: values.name });
      addToast({ type: 'success', message: 'Perfil actualizado' });
    } catch (err) {
      addToast({ type: 'error', message: extractError(err) });
    } finally {
      setIsSaving(false);
    }
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?';

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Mi Perfil</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Gestiona tu información personal</p>
      </div>

      {/* Avatar section */}
      <Card padding="md" className="flex items-center gap-6">
        <div className="relative flex-shrink-0">
          {user?.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-300 font-display">{initials}</span>
            </div>
          )}
          <button
            className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Cambiar foto de perfil"
            title="Próximamente"
            disabled
          >
            <Camera className="h-3.5 w-3.5 text-neutral-500" />
          </button>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-neutral-800 dark:text-neutral-100 truncate">{user?.name}</p>
          <p className="text-sm text-neutral-500 truncate">{user?.email}</p>
          {user?.createdAt && (
            <p className="text-xs text-neutral-400 mt-1">
              Miembro desde {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: es })}
            </p>
          )}
        </div>
      </Card>

      {/* Edit form */}
      <Card padding="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Información personal</h2>
          <Input
            label="Nombre"
            leftIcon={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register('name')}
          />
          <Input
            label="Correo electrónico"
            type="email"
            leftIcon={<Mail className="h-4 w-4" />}
            value={user?.email ?? ''}
            disabled
            helperText="El correo no puede modificarse"
          />
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              size="sm"
              leftIcon={<Save className="h-4 w-4" />}
              loading={isSaving}
              disabled={!isDirty}
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>

      {/* Account info */}
      <Card padding="md" className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Cuenta</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">ID de usuario</span>
          <code className="text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400 font-mono truncate max-w-[200px]">
            {user?.id}
          </code>
        </div>
      </Card>
    </div>
  );
}
