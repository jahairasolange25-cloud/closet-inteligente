import { api } from '@/lib/api';
import type {
  Outfit,
  CreateOutfitDto,
  UpdateOutfitDto,
  OutfitFilters,
  RecommendOutfitDto,
  OutfitRecommendation,
} from '@/types/outfit';
import type { PaginatedResponse } from '@/types/api';

export const outfitsService = {
  async list(filters?: OutfitFilters): Promise<PaginatedResponse<Outfit>> {
    const { data } = await api.get<PaginatedResponse<Outfit>>('/outfits', { params: filters });
    return data;
  },

  async get(id: string): Promise<Outfit> {
    const { data } = await api.get<Outfit>(`/outfits/${id}`);
    return data;
  },

  async create(dto: CreateOutfitDto): Promise<Outfit> {
    const { data } = await api.post<Outfit>('/outfits', dto);
    return data;
  },

  async update(id: string, dto: UpdateOutfitDto): Promise<Outfit> {
    const { data } = await api.patch<Outfit>(`/outfits/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/outfits/${id}`);
  },

  async recommend(dto: RecommendOutfitDto): Promise<{ recommendations: OutfitRecommendation[]; meta: { warning?: string } }> {
    const { data } = await api.post<{ recommendations: OutfitRecommendation[]; meta: { warning?: string } }>(
      '/outfits/recommend',
      dto,
    );
    return data;
  },
};
