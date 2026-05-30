'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Trash2, Edit, Clock, Check, X, Tag } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useGarment, useUpdateGarment, useDeleteGarment, useUploadGarmentImage } from '@/hooks/use-garments';
import { GarmentImageUploader } from './garment-image-uploader';
import { PipelineTimeline, usePipelineSteps } from './pipeline-timeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import type { GarmentState } from '@/types/garment';

interface Props { id: string }

const editSchema = z.object({
  name: z.string().min(1, 'Requerido').max(100),
  brand: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  color: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
});
type EditForm = z.infer<typeof editSchema>;

const pipelineLabels: Record<string, { label: string; variant: 'default' | 'warning' | 'success' | 'error' | 'primary' }> = {
  pending: { label: 'Pendiente', variant: 'default' },
  processing: { label: 'Procesando...', variant: 'warning' },
  completed: { label: 'Procesado', variant: 'success' },
  failed: { label: 'Error IA', variant: 'error' },
};

const stateLabels: Record<GarmentState, string> = {
  available: 'Disponible',
  washing: 'En lavado',
  damaged: 'Dañada',
  storage: 'Guardada',
  for_sale: 'En venta',
  donated: 'Donada',
};

export function GarmentDetailPage({ id }: Props) {
  const router = useRouter();
  const { data: garment, isLoading } = useGarment(id);
  const updateMutation = useUpdateGarment(id);
  const deleteMutation = useDeleteGarment();
  const uploadMutation = useUploadGarmentImage(id);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    values: garment ? {
      name: garment.name,
      brand: garment.brand ?? '',
      size: garment.size ?? '',
      color: garment.color ?? '',
      notes: garment.notes ?? '',
    } : undefined,
  });

  const onSaveEdit = handleSubmit(async (data) => {
    await updateMutation.mutateAsync({
      name: data.name,
      brand: data.brand || undefined,
      size: data.size || undefined,
      color: data.color || undefined,
      notes: data.notes || undefined,
    });
    setEditing(false);
  });

  const handleCancelEdit = () => {
    reset();
    setEditing(false);
  };

  const pipelineSteps = usePipelineSteps(garment?.pipelineStatus);

  if (isLoading) {
    return (
      <div className="max-w-4xl flex flex-col gap-6">
        <Skeleton variant="line" className="h-8 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton variant="rect" className="aspect-square" />
          <Skeleton variant="rect" className="h-80" />
        </div>
      </div>
    );
  }

  if (!garment) return (
    <div className="text-center py-16">
      <p className="text-neutral-500">Prenda no encontrada</p>
      <Link href="/garments"><Button variant="outline" size="sm" className="mt-4">← Volver al closet</Button></Link>
    </div>
  );

  const pipeline = pipelineLabels[garment.pipelineStatus] ?? pipelineLabels['pending']!;

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/garments">
            <Button variant="ghost" size="icon-sm" aria-label="Volver al closet"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          {editing ? (
            <Input
              {...register('name')}
              className="text-2xl font-bold font-display h-auto py-1 px-2"
              aria-label="Nombre de la prenda"
            />
          ) : (
            <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100 truncate">{garment.name}</h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="icon-sm" aria-label="Cancelar edición" onClick={handleCancelEdit}>
                <X className="h-4 w-4" aria-hidden />
              </Button>
              <Button size="sm" loading={updateMutation.isPending} onClick={onSaveEdit} leftIcon={<Check className="h-4 w-4" />}>
                Guardar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={garment.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                aria-pressed={garment.isFavorite}
                onClick={() => updateMutation.mutate({ isFavorite: !garment.isFavorite })}
              >
                <Heart className={garment.isFavorite ? 'fill-error-500 text-error-500 h-5 w-5' : 'h-5 w-5'} aria-hidden />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Editar prenda" onClick={() => setEditing(true)}>
                <Edit className="h-4 w-4" aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Eliminar prenda"
                className="text-error-500 hover:text-error-600 hover:bg-error-50"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Image */}
        <GarmentImageUploader
          onUpload={async (file) => { await uploadMutation.mutateAsync(file); }}
          currentImageUrl={garment.imageUrl}
          isLoading={uploadMutation.isPending}
        />

        {/* Info panel */}
        <div className="flex flex-col gap-4">
          <Card padding="md">
            <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {editing ? (
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'Marca', field: 'brand' as const, placeholder: 'Ej. Zara' },
                    { label: 'Talla', field: 'size' as const, placeholder: 'Ej. M, 38' },
                    { label: 'Color', field: 'color' as const, placeholder: 'Ej. azul marino' },
                  ].map(({ label, field, placeholder }) => (
                    <div key={field} className="flex items-center gap-3">
                      <span className="text-sm text-neutral-500 w-16 flex-shrink-0">{label}</span>
                      <Input {...register(field)} placeholder={placeholder} className="flex-1" />
                    </div>
                  ))}
                  {errors.name && <p className="text-xs text-error-600">{errors.name.message}</p>}
                </div>
              ) : (
                <>
                  {[
                    { label: 'Categoría', value: garment.category },
                    { label: 'Color', value: garment.color },
                    { label: 'Marca', value: garment.brand },
                    { label: 'Talla', value: garment.size },
                    { label: 'Estado', value: stateLabels[garment.state as GarmentState] ?? garment.state },
                  ].filter((a) => a.value).map((attr) => (
                    <div key={attr.label} className="flex items-start justify-between gap-2">
                      <span className="text-sm text-neutral-500">{attr.label}</span>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">{attr.value}</span>
                    </div>
                  ))}

                  {garment.usageCount > 0 && (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm text-neutral-500">Usos</span>
                      <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{garment.usageCount}</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Material */}
          {garment.material && garment.material.length > 0 && (
            <Card padding="md">
              <CardHeader><CardTitle>Material</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {garment.material.map((m) => (
                    <Badge key={m} variant="default" className="capitalize">{m}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {garment.tags && garment.tags.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" aria-hidden />
                  Etiquetas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {garment.tags.map((tag) => (
                    <Badge key={tag} variant="primary" className="capitalize">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* IA Processing */}
          <Card padding="md">
            <CardHeader><CardTitle>Procesamiento IA</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant={pipeline.variant}>
                  {garment.pipelineStatus === 'processing' && <Clock className="h-3 w-3 mr-1 animate-spin" />}
                  {pipeline.label}
                </Badge>
              </div>
              <PipelineTimeline steps={pipelineSteps} />
              {garment.color && garment.pipelineStatus === 'completed' && (
                <div className="mt-4 flex items-center gap-2 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <span className="text-xs text-neutral-500">Color detectado:</span>
                  <div className="h-5 w-5 rounded-full border border-neutral-200" style={{ backgroundColor: garment.color }} aria-label={garment.color} />
                  <span className="text-xs text-neutral-600">{garment.color}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes (editable) */}
          {(garment.notes || editing) && (
            <Card padding="md">
              <CardHeader><CardTitle>Notas</CardTitle></CardHeader>
              <CardContent>
                {editing ? (
                  <textarea
                    {...register('notes')}
                    className="w-full text-sm text-neutral-600 dark:text-neutral-400 bg-transparent border border-neutral-200 dark:border-neutral-700 rounded-lg p-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                    rows={3}
                    placeholder="Añade notas sobre esta prenda..."
                    aria-label="Notas de la prenda"
                  />
                ) : (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">{garment.notes}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Eliminar prenda"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={async () => {
                await deleteMutation.mutateAsync(id);
                router.push('/garments');
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ¿Estás segura de que quieres eliminar <strong>{garment.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
