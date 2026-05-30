'use client';

import { Suspense, lazy, useRef, useState } from 'react';
import { User, Upload, Video, CheckCircle, AlertCircle, Loader2, RotateCcw, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { avatarService } from '@/services/avatar.service';
import { useAvatarStore } from '@/stores/avatar-store';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { GenerationStatus } from '@/types/avatar';

const AvatarCanvas = lazy(() =>
  import('@/lib/r3f/canvas-wrapper').then((m) => ({ default: m.AvatarCanvas })),
);

// ── Measurements form ────────────────────────────────────────────────────────

const measurementsSchema = z.object({
  height_cm: z.coerce.number().min(50).max(300).optional().or(z.literal('')),
  chest_cm: z.coerce.number().min(10).max(300).optional().or(z.literal('')),
  waist_cm: z.coerce.number().min(10).max(300).optional().or(z.literal('')),
  hips_cm: z.coerce.number().min(10).max(300).optional().or(z.literal('')),
  inseam_cm: z.coerce.number().min(10).max(200).optional().or(z.literal('')),
  shoulder_width_cm: z.coerce.number().min(5).max(100).optional().or(z.literal('')),
});

type MeasurementsForm = z.infer<typeof measurementsSchema>;

const MEASUREMENT_FIELDS: { name: keyof MeasurementsForm; label: string; placeholder: string }[] = [
  { name: 'height_cm', label: 'Altura', placeholder: 'ej. 170' },
  { name: 'chest_cm', label: 'Pecho', placeholder: 'ej. 90' },
  { name: 'waist_cm', label: 'Cintura', placeholder: 'ej. 75' },
  { name: 'hips_cm', label: 'Cadera', placeholder: 'ej. 95' },
  { name: 'inseam_cm', label: 'Entrepierna', placeholder: 'ej. 78' },
  { name: 'shoulder_width_cm', label: 'Hombros', placeholder: 'ej. 42' },
];

function MeasurementsStep({ onCreated }: { onCreated: () => void }) {
  const { setAvatar } = useAvatarStore();
  const { addToast } = useUIStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<MeasurementsForm>({
    resolver: zodResolver(measurementsSchema),
  });

  const onSubmit = async (values: MeasurementsForm) => {
    setIsSubmitting(true);
    try {
      const dto = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== '' && v !== undefined).map(([k, v]) => [k, Number(v)])
      );
      const avatar = await avatarService.create(dto);
      setAvatar(avatar);
      addToast({ type: 'success', message: 'Perfil de avatar creado' });
      onCreated();
    } catch {
      addToast({ type: 'error', message: 'Error al crear el avatar' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Medidas corporales</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Todas las medidas son opcionales (en cm)</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          {MEASUREMENT_FIELDS.map((field) => (
            <Input
              key={field.name}
              type="number"
              label={field.label}
              placeholder={field.placeholder}
              error={errors[field.name]?.message}
              {...register(field.name)}
            />
          ))}
        </div>
        <Button type="submit" loading={isSubmitting} className="w-full">
          Crear perfil de avatar
        </Button>
      </form>
    </Card>
  );
}

// ── Video upload step ────────────────────────────────────────────────────────

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
const MAX_VIDEO_MB = 200;

function VideoUploadStep({ onUploaded }: { onUploaded: (generationId: string) => void }) {
  const { avatar, setGenerationId, setGenerationStatus } = useAvatarStore();
  const { addToast } = useUIStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = (file: File) => {
    if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
      addToast({ type: 'warning', message: 'Formato no válido. Usa MP4, MOV o AVI.' });
      return;
    }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      addToast({ type: 'warning', message: `El video no puede superar ${MAX_VIDEO_MB} MB.` });
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !avatar) return;
    setIsUploading(true);
    setUploadPct(0);
    try {
      const result = await avatarService.generate(avatar.id, selectedFile, setUploadPct);
      setGenerationId(result.generation_id);
      setGenerationStatus('pending');
      addToast({ type: 'success', message: 'Video enviado. Generando avatar...' });
      onUploaded(result.generation_id);
    } catch {
      addToast({ type: 'error', message: 'Error al subir el video' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card padding="md" className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Generar avatar 3D</h2>
        <p className="text-sm text-neutral-500 mt-0.5">Sube un video corto para generar tu avatar</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 py-10 transition-colors ${
          isDragging
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/10'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/x-msvideo"
          className="sr-only"
          onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
        />
        {selectedFile ? (
          <>
            <Video className="h-8 w-8 text-primary-500" />
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{selectedFile.name}</p>
            <p className="text-xs text-neutral-400">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
          </>
        ) : (
          <>
            <Upload className="h-8 w-8 text-neutral-400" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
              Arrastra tu video o <span className="text-primary-500">haz clic para seleccionar</span>
            </p>
            <p className="text-xs text-neutral-400">MP4, MOV, AVI · máx. 200 MB</p>
          </>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>Subiendo video…</span>
            <span>{uploadPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Requirements */}
      <div className="rounded-lg bg-info-50 dark:bg-info-900/10 border border-info-200 dark:border-info-800 p-3 flex gap-2">
        <Info className="h-4 w-4 text-info-500 flex-shrink-0 mt-0.5" />
        <ul className="text-xs text-info-700 dark:text-info-300 space-y-1">
          <li>· Duración: 5-30 segundos</li>
          <li>· Posición: de pie, brazos ligeramente separados</li>
          <li>· Fondo sólido, buena iluminación</li>
          <li>· Resolución mínima: 480p</li>
        </ul>
      </div>

      <Button
        onClick={handleUpload}
        loading={isUploading}
        disabled={!selectedFile || isUploading}
        className="w-full"
      >
        Generar avatar
      </Button>
    </Card>
  );
}

// ── Processing / result states ────────────────────────────────────────────────

function ProcessingState({ status, onReset }: { status: GenerationStatus; onReset: () => void }) {
  if (status === 'pending' || status === 'generating') {
    return (
      <Card padding="md" className="flex flex-col items-center gap-4 py-10">
        <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary-500 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Generando tu avatar</p>
          <p className="text-sm text-neutral-500 mt-1">Esto puede tardar algunos minutos</p>
        </div>
        <p className="text-xs text-neutral-400 text-center max-w-xs">
          Te notificaremos cuando esté listo. Puedes cerrar esta ventana.
        </p>
      </Card>
    );
  }

  if (status === 'failed') {
    return (
      <Card padding="md" className="flex flex-col items-center gap-4 py-10">
        <div className="h-16 w-16 rounded-full bg-error-100 dark:bg-error-900/20 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-error-500" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-neutral-800 dark:text-neutral-100">Error al generar el avatar</p>
          <p className="text-sm text-neutral-500 mt-1">El video no pudo procesarse correctamente</p>
        </div>
        <Button variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onReset}>
          Intentar de nuevo
        </Button>
      </Card>
    );
  }

  if (status === 'completed') {
    return (
      <div className="flex flex-col gap-4">
        <Card padding="md" className="flex flex-col items-center gap-3 py-6">
          <div className="h-12 w-12 rounded-full bg-success-100 dark:bg-success-900/20 flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-success-500" />
          </div>
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Avatar generado</p>
        </Card>
        <Suspense fallback={<AvatarCanvasFallback />}>
          <AvatarCanvas />
        </Suspense>
      </div>
    );
  }

  return null;
}

// ── Avatar canvas fallback ────────────────────────────────────────────────────

function AvatarCanvasFallback() {
  return (
    <div className="aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl bg-gradient-to-b from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 flex flex-col items-center justify-center gap-4">
      <div className="h-16 w-16 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
        <User className="h-8 w-8 text-neutral-400" />
      </div>
      <p className="text-sm text-neutral-400">Cargando avatar 3D…</p>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Step = 'measurements' | 'upload' | 'processing';

export function AvatarPage() {
  const { avatar, generationStatus, setGenerationStatus, reset } = useAvatarStore();

  const deriveStep = (): Step => {
    if (!avatar) return 'measurements';
    if (generationStatus === 'idle') return 'upload';
    return 'processing';
  };

  const [step, setStep] = useState<Step>(deriveStep);

  const handleMeasurementsCreated = () => setStep('upload');

  const handleVideoUploaded = (_generationId: string) => {
    setGenerationStatus('generating');
    setStep('processing');
  };

  const handleReset = () => {
    reset();
    setStep('measurements');
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Mi Avatar</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Crea tu avatar 3D para visualizar outfits</p>
        </div>
        {avatar && generationStatus === 'idle' && (
          <Button variant="ghost" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={handleReset}>
            Reiniciar
          </Button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(['measurements', 'upload', 'processing'] as Step[]).map((s, i) => {
          const labels = ['Medidas', 'Video', 'Generación'];
          const isActive = step === s;
          const isDone = (step === 'upload' && s === 'measurements') || (step === 'processing' && s !== 'processing');
          return (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center gap-1.5 ${isActive ? 'text-primary-600 dark:text-primary-400' : isDone ? 'text-success-600 dark:text-success-400' : 'text-neutral-400'}`}>
                <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isActive ? 'border-primary-500 bg-primary-500 text-white' :
                  isDone ? 'border-success-500 bg-success-500 text-white' :
                  'border-neutral-300 dark:border-neutral-600'
                }`}>
                  {isDone ? '✓' : i + 1}
                </span>
                <span className="text-xs font-medium hidden sm:block">{labels[i]}</span>
              </div>
              {i < 2 && <div className={`flex-1 h-px min-w-[20px] ${isDone ? 'bg-success-400' : 'bg-neutral-200 dark:bg-neutral-700'}`} />}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          {step === 'measurements' && (
            <MeasurementsStep onCreated={handleMeasurementsCreated} />
          )}
          {step === 'upload' && (
            <VideoUploadStep onUploaded={handleVideoUploaded} />
          )}
          {step === 'processing' && (
            <ProcessingState status={generationStatus} onReset={handleReset} />
          )}
        </div>

        {/* Right panel: always show 3D canvas placeholder or actual canvas */}
        <div className="flex flex-col gap-3">
          {generationStatus === 'completed' ? (
            <Suspense fallback={<AvatarCanvasFallback />}>
              <AvatarCanvas />
            </Suspense>
          ) : (
            <AvatarCanvasFallback />
          )}

          {/* Measurements summary if avatar exists */}
          {avatar && (
            <Card padding="md" className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Medidas registradas</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  { label: 'Altura', value: avatar.height_cm, unit: 'cm' },
                  { label: 'Pecho', value: avatar.chest_cm, unit: 'cm' },
                  { label: 'Cintura', value: avatar.waist_cm, unit: 'cm' },
                  { label: 'Cadera', value: avatar.hips_cm, unit: 'cm' },
                  { label: 'Entrepierna', value: avatar.inseam_cm, unit: 'cm' },
                  { label: 'Hombros', value: avatar.shoulder_width_cm, unit: 'cm' },
                ].map(({ label, value, unit }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-neutral-500">{label}</span>
                    <span className="font-medium text-neutral-700 dark:text-neutral-300">
                      {value != null ? `${value} ${unit}` : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
