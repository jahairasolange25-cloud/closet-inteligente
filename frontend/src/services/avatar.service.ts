import { api } from '@/lib/api';
import type { Avatar, CreateAvatarDto, GenerateAvatarResponse } from '@/types/avatar';

export const avatarService = {
  async create(dto: CreateAvatarDto): Promise<Avatar> {
    const { data } = await api.post<Avatar>('/avatars', dto);
    return data;
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
