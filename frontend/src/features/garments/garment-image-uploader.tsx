'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { Upload, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface GarmentImageUploaderProps {
  onUpload: (file: File) => Promise<void>;
  currentImageUrl?: string | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const ACCEPTED = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] };
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function GarmentImageUploader({ onUpload, currentImageUrl, isLoading, error, onRetry }: GarmentImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      setPreview(url);
      try {
        await onUpload(file);
      } catch {
        setPreview(null);
      }
    },
    [onUpload],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: isLoading,
  });

  const imageUrl = preview ?? currentImageUrl;

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={cn(
          'relative aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
          isLoading && 'cursor-not-allowed opacity-60',
        )}
        aria-label="Subir imagen de prenda"
      >
        <input {...getInputProps()} aria-label="Seleccionar imagen" />

        {imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Vista previa"
              fill
              sizes="(max-width: 640px) 90vw, 400px"
              className="object-cover rounded-2xl"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEADkD+JaQAA3AAAAAA"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-neutral-900/70 rounded-2xl">
                <Spinner size="lg" label="Subiendo imagen..." />
              </div>
            )}
          </>
        ) : (
          <>
            {isLoading ? (
              <Spinner size="lg" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-neutral-400" aria-hidden />
                <div className="text-center">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {isDragActive ? 'Suelta aquí' : 'Arrastra o haz clic para subir'}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    JPG, PNG, WEBP, HEIC · Máx. 10MB
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <p className="text-xs text-error-600" role="alert">
          {fileRejections[0]?.errors[0]?.message ?? 'Archivo inválido'}
        </p>
      )}

      {error && (
        <div className="flex flex-col gap-2" role="alert">
          <p className="text-xs text-error-600 dark:text-error-400">{error}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      )}

      {imageUrl && !isLoading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<ImageIcon className="h-4 w-4" />}
          onClick={() => setPreview(null)}
        >
          Cambiar imagen
        </Button>
      )}
    </div>
  );
}
