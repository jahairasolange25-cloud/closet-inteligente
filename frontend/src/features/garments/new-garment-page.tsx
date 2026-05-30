'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GarmentForm } from './garment-form';
import { GarmentImageUploader } from './garment-image-uploader';
import { UploadQueue, type UploadItem } from './upload-queue';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCreateGarment, useUploadGarmentImage } from '@/hooks/use-garments';
import type { CreateGarmentFormData } from '@/lib/validations/garment';
import { useState } from 'react';

export function NewGarmentPage() {
  const router = useRouter();
  const createMutation = useCreateGarment();
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const uploadMutation = useUploadGarmentImage(createdId ?? '');

  const handleSubmit = async (data: CreateGarmentFormData) => {
    setCreateError(null);
    try {
      const garment = await createMutation.mutateAsync(data);
      setCreatedId(garment.id);
      router.push(`/garments/${garment.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al guardar la prenda');
    }
  };

  const handleUpload = async (file: File) => {
    if (!createdId) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setUploadQueue((prev) => [...prev, { id, fileName: file.name, status: 'queued' }]);
    setUploadQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'uploading' as const, progress: 0 } : item)),
    );
    try {
      await uploadMutation.mutateAsync(file);
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'uploading' as const, progress: 50 } : item)),
      );
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'completed' as const, progress: 100 } : item)),
      );
    } catch (err) {
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: 'failed' as const, error: err instanceof Error ? err.message : 'Error de subida' }
            : item,
        ),
      );
    }
  };

  const handleRetry = async (queueId: string) => {
    const item = uploadQueue.find((i) => i.id === queueId);
    if (!item || item.status !== 'failed') return;
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.onchange = async () => {
      const file = fileInput.files?.[0];
      if (file) await handleUpload(file);
    };
    fileInput.click();
  };

  const handleDismiss = (queueId: string) => {
    setUploadQueue((prev) => prev.filter((i) => i.id !== queueId));
  };

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/garments">
          <Button variant="ghost" size="icon-sm" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Añadir Prenda</h1>
      </div>

      <UploadQueue items={uploadQueue} onRetry={handleRetry} onDismiss={handleDismiss} />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card padding="md">
          <CardHeader><CardTitle>Foto de la prenda</CardTitle></CardHeader>
          <GarmentImageUploader
            onUpload={handleUpload}
            isLoading={uploadMutation.isPending}
            error={uploadMutation.error ? (uploadMutation.error instanceof Error ? uploadMutation.error.message : 'Error de subida') : null}
          />
          {!createdId && (
            <p className="text-xs text-neutral-400 mt-2 text-center">
              Primero guarda la prenda para subir una imagen
            </p>
          )}
        </Card>

        <Card padding="md">
          <CardHeader><CardTitle>Información</CardTitle></CardHeader>
          <GarmentForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="Guardar prenda"
            error={createError}
            onRetry={() => setCreateError(null)}
          />
        </Card>
      </div>
    </div>
  );
}
