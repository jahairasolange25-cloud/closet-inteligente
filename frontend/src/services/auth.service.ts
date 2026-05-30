import { api } from '@/lib/api';
import type { AuthResponse, LoginDto, RegisterDto, RefreshResponse, User } from '@/types/auth';

export const authService = {
  async login(dto: LoginDto): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', dto);
    return data;
  },

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', dto);
    return data;
  },

  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const { data } = await api.post<RefreshResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  async logout(accessToken: string): Promise<void> {
    await api.post('/auth/logout', { accessToken });
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};
