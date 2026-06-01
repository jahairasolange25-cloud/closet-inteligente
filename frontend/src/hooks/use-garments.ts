import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { garmentsService } from '@/services/garments.service';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { extractError } from '@/lib/api';
import type { Garment, GarmentFilters, CreateGarmentDto, UpdateGarmentDto, PaginatedGarments } from '@/types/garment';

export const GARMENTS_KEY = 'garments';

export function useGarments(filters?: GarmentFilters) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: [GARMENTS_KEY, filters],
    queryFn: () => garmentsService.list(filters),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

export function useGarment(id: string | null) {
  return useQuery({
    queryKey: [GARMENTS_KEY, id],
    queryFn: () => garmentsService.get(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateGarment() {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: CreateGarmentDto) => garmentsService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GARMENTS_KEY] });
      addToast({ type: 'success', message: 'Prenda creada exitosamente' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: extractError(err) });
    },
  });
}

export function useUpdateGarment(id: string) {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: UpdateGarmentDto) => garmentsService.update(id, dto),

    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: [GARMENTS_KEY, id] });
      const previous = qc.getQueryData<Garment>([GARMENTS_KEY, id]);
      if (previous) {
        qc.setQueryData<Garment>([GARMENTS_KEY, id], { ...previous, ...dto });
      }
      // Also update list caches
      qc.setQueriesData<PaginatedGarments>(
        { queryKey: [GARMENTS_KEY], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((g) => (g.id === id ? { ...g, ...dto } : g)),
          };
        },
      );
      return { previous };
    },

    onError: (err, _dto, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([GARMENTS_KEY, id], ctx.previous);
      }
      qc.invalidateQueries({ queryKey: [GARMENTS_KEY] });
      addToast({ type: 'error', message: extractError(err) });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: [GARMENTS_KEY, id] });
    },
  });
}

export function useDeleteGarment() {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => garmentsService.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [GARMENTS_KEY] });
      const snapshots = new Map<readonly unknown[], PaginatedGarments | undefined>();
      const queries = qc.getQueriesData<PaginatedGarments>({ queryKey: [GARMENTS_KEY] });
      for (const [key, data] of queries) {
        snapshots.set(key, data);
        if (data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.filter((g) => g.id !== id),
            meta: { ...data.meta, total: Math.max(0, data.meta.total - 1) },
          });
        }
      }
      return { snapshots };
    },

    onError: (err, _id, ctx) => {
      if (ctx?.snapshots) {
        for (const [key, data] of ctx.snapshots.entries()) {
          qc.setQueryData(key as readonly unknown[], data);
        }
      }
      addToast({ type: 'error', message: extractError(err) });
    },

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GARMENTS_KEY] });
      addToast({ type: 'success', message: 'Prenda eliminada' });
    },
  });
}

export function useUploadGarmentImage(id: string) {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (file: File) => garmentsService.uploadImage(id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GARMENTS_KEY, id] });
      addToast({ type: 'success', message: 'Imagen subida. Procesando...' });
    },
    onError: (err) => {
      addToast({ type: 'error', message: extractError(err) });
    },
  });
}
