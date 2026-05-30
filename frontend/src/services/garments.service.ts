import { api } from '@/lib/api';
import type {
  Garment,
  CreateGarmentDto,
  UpdateGarmentDto,
  GarmentFilters,
  PaginatedGarments,
} from '@/types/garment';

export const garmentsService = {
  async list(filters?: GarmentFilters): Promise<PaginatedGarments> {
    const { data } = await api.get<PaginatedGarments>('/garments', { params: filters });
    return data;
  },

  async get(id: string): Promise<Garment> {
    const { data } = await api.get<Garment>(`/garments/${id}`);
    return data;
  },

  async create(dto: CreateGarmentDto): Promise<Garment> {
    const { data } = await api.post<Garment>('/garments', dto);
    return data;
  },

  async update(id: string, dto: UpdateGarmentDto): Promise<Garment> {
    const { data } = await api.patch<Garment>(`/garments/${id}`, dto);
    return data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/garments/${id}`);
  },

  async uploadImage(id: string, file: File): Promise<Garment> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<Garment>(`/garments/${id}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async search(query: string, filters?: Omit<GarmentFilters, 'search'>): Promise<PaginatedGarments> {
    const { data } = await api.get<PaginatedGarments>('/garments/search', {
      params: { q: query, ...filters },
    });
    return data;
  },

  async triggerPipeline(id: string): Promise<void> {
    await api.post(`/garments/${id}/pipeline`);
  },
};
