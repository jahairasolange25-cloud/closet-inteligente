'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Bell, Moon, Sun, Monitor, Globe, Shield, Trash2 } from 'lucide-react';
import { notificationsService } from '@/services/notifications.service';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { extractError } from '@/lib/api';
import type { NotificationPreferences } from '@/types/notification';

type ThemeOption = 'light' | 'dark' | 'system';

const THEME_OPTIONS: { value: ThemeOption; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Oscuro', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'Sistema', icon: <Monitor className="h-4 w-4" /> },
];

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 h-6 w-11 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-primary-500' : 'bg-neutral-200 dark:bg-neutral-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { addToast } = useUIStore();
  const [mounted, setMounted] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const isDeletingAccount = false;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    notificationsService.getPreferences()
      .then(setPrefs)
      .catch(() => {})
      .finally(() => setIsLoadingPrefs(false));
  }, []);

  const updatePref = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setIsSavingPrefs(true);
    try {
      await notificationsService.updatePreferences({ [key]: value });
    } catch (err) {
      setPrefs(prefs);
      addToast({ type: 'error', message: extractError(err) });
    } finally {
      setIsSavingPrefs(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Configuración</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Personaliza tu experiencia</p>
      </div>

      {/* Appearance */}
      <Card padding="md" className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Apariencia</h2>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-neutral-500">Tema de la interfaz</p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  mounted && theme === opt.value
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-300'
                    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card padding="md" className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-neutral-400" />
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Notificaciones</h2>
          </div>
          {isSavingPrefs && <Badge variant="default" className="text-[10px]">Guardando…</Badge>}
        </div>
        {isLoadingPrefs ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="line" className="h-10" />)}
          </div>
        ) : prefs ? (
          <>
            <ToggleRow
              label="Notificaciones push"
              description="Recibe alertas en tu dispositivo"
              checked={prefs.pushEnabled}
              onChange={(v) => updatePref('pushEnabled', v)}
            />
            <ToggleRow
              label="Correo electrónico"
              description="Resúmenes y alertas por email"
              checked={prefs.emailEnabled}
              onChange={(v) => updatePref('emailEnabled', v)}
            />
            <ToggleRow
              label="Recordatorios de outfit"
              description="Te avisamos cuando planifiques ropa"
              checked={prefs.outfitReminders}
              onChange={(v) => updatePref('outfitReminders', v)}
            />
            <ToggleRow
              label="Recomendaciones IA"
              description="Sugerencias personalizadas de outfits"
              checked={prefs.recommendations}
              onChange={(v) => updatePref('recommendations', v)}
            />
          </>
        ) : (
          <p className="text-sm text-neutral-400 py-2">No se pudieron cargar las preferencias.</p>
        )}
      </Card>

      {/* Privacy */}
      <Card padding="md" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-neutral-400" />
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Privacidad y datos</h2>
        </div>
        <p className="text-xs text-neutral-500 leading-relaxed">
          Tus datos se procesan de forma segura. Las imágenes de prendas son procesadas por nuestro pipeline de IA
          únicamente para mejorar tu experiencia de organización del armario.
        </p>
        <div className="pt-1">
          <Button
            variant="danger"
            size="sm"
            leftIcon={<Trash2 className="h-4 w-4" />}
            loading={isDeletingAccount}
            onClick={() => {
              addToast({ type: 'warning', message: 'Eliminación de cuenta próximamente disponible.' });
            }}
          >
            Eliminar cuenta
          </Button>
        </div>
      </Card>
    </div>
  );
}
