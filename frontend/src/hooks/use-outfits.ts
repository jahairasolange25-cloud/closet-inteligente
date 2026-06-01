import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { outfitsService } from '@/services/outfits.service';
import { useUIStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { extractError } from '@/lib/api';
import type { Outfit, OutfitFilters, CreateOutfitDto, UpdateOutfitDto, RecommendOutfitDto } from '@/types/outfit';
import type { PaginatedResponse } from '@/types/api';

export const OUTFITS_KEY = 'outfits';

export function useOutfits(filters?: OutfitFilters) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: [OUTFITS_KEY, filters],
    queryFn: () => outfitsService.list(filters),
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
    enabled: isAuthenticated,
  });
}

export function useOutfit(id: string | null) {
  return useQuery({
    queryKey: [OUTFITS_KEY, id],
    queryFn: () => outfitsService.get(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateOutfit() {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: CreateOutfitDto) => outfitsService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [OUTFITS_KEY] });
      addToast({ type: 'success', message: 'Outfit creado exitosamente' });
    },
    onError: (err) => addToast({ type: 'error', message: extractError(err) }),
  });
}

export function useUpdateOutfit(id: string) {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: UpdateOutfitDto) => outfitsService.update(id, dto),

    onMutate: async (dto) => {
      await qc.cancelQueries({ queryKey: [OUTFITS_KEY, id] });
      const previous = qc.getQueryData<Outfit>([OUTFITS_KEY, id]);
      if (previous) {
        qc.setQueryData<Outfit>([OUTFITS_KEY, id], { ...previous, ...dto });
      }
      qc.setQueriesData<PaginatedResponse<Outfit>>(
        { queryKey: [OUTFITS_KEY], exact: false },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((o) => (o.id === id ? { ...o, ...dto } : o)),
          };
        },
      );
      return { previous };
    },

    onError: (err, _dto, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData([OUTFITS_KEY, id], ctx.previous);
      }
      qc.invalidateQueries({ queryKey: [OUTFITS_KEY] });
      addToast({ type: 'error', message: extractError(err) });
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: [OUTFITS_KEY, id] });
    },
  });
}

export function useDeleteOutfit() {
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => outfitsService.delete(id),

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: [OUTFITS_KEY] });
      const snapshots = new Map<readonly unknown[], PaginatedResponse<Outfit> | undefined>();
      const queries = qc.getQueriesData<PaginatedResponse<Outfit>>({ queryKey: [OUTFITS_KEY] });
      for (const [key, data] of queries) {
        snapshots.set(key, data);
        if (data) {
          qc.setQueryData(key, {
            ...data,
            data: data.data.filter((o) => o.id !== id),
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
      qc.invalidateQueries({ queryKey: [OUTFITS_KEY] });
      addToast({ type: 'success', message: 'Outfit eliminado' });
    },
  });
}

export function useOutfitRecommendations() {
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: RecommendOutfitDto) => outfitsService.recommend(dto),
    onError: (err) => addToast({ type: 'error', message: extractError(err) }),
  });
}
