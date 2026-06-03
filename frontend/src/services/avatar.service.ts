import { api } from '@/lib/api';
import type { Avatar, CreateAvatarDto, GenerateAvatarResponse } from '@/types/avatar';

export const avatarService = {
  async getMyAvatar(): Promise<Avatar> {
    const { data } = await api.get<Avatar>('/avatars/me');
    return data;
  },

  async create(dto: CreateAvatarDto): Promise<Avatar> {
    const { data } = await api.post<Avatar>('/avatars', dto);
    return data;
  },

  async update(avatarId: string, dto: CreateAvatarDto): Promise<Avatar> {
    const { data } = await api.patch<Avatar>(`/avatars/${avatarId}`, dto);
    return data;
  },

  async remove(avatarId: string): Promise<void> {
    await api.delete(`/avatars/${avatarId}`);
  },

  async generate(avatarId: string, file: File, onProgress?: (pct: number) => void): Promise<GenerateAvatarResponse> {
    const form = new FormData();
    form.append('video', file);
    const { data } = await api.post<GenerateAvatarResponse>(`/avatars/${avatarId}/generate`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data;
  },
};
