import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import { extractError } from '@/lib/api';
import { broadcastLogout } from '@/lib/auth-broadcast';
import type { User, LoginDto, RegisterDto } from '@/types/auth';

const ACCESS_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY ?? 'closet_access_token';
const REFRESH_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? 'closet_refresh_token';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;

  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isRestoring: true,
      error: null,

      login: async (dto) => {
        set({ isLoading: true, error: null });
        try {
          const { user, tokens } = await authService.login(dto);
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACCESS_KEY, tokens.accessToken);
            localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ error: extractError(err), isLoading: false });
          throw err;
        }
      },

      register: async (dto) => {
        set({ isLoading: true, error: null });
        try {
          const { user, tokens } = await authService.register(dto);
          if (typeof window !== 'undefined') {
            localStorage.setItem(ACCESS_KEY, tokens.accessToken);
            localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
          }
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ error: extractError(err), isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
          if (token) await authService.logout(token).catch(() => {});
        } finally {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(ACCESS_KEY);
            localStorage.removeItem(REFRESH_KEY);
          }
          broadcastLogout();
          set({ user: null, isAuthenticated: false, isLoading: false, error: null });
        }
      },

      fetchMe: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
        if (!token) return;
        set({ isLoading: true });
        try {
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      restoreSession: async () => {
        set({ isRestoring: true });
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
          if (!token) {
            set({ user: null, isAuthenticated: false, isRestoring: false });
            return;
          }
          const user = await authService.getMe();
          set({ user, isAuthenticated: true, isRestoring: false });
        } catch {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(ACCESS_KEY);
            localStorage.removeItem(REFRESH_KEY);
          }
          set({ user: null, isAuthenticated: false, isRestoring: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      clearError: () => set({ error: null }),

      hydrateFromStorage: () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_KEY) : null;
        if (!token && get().isAuthenticated) {
          set({ user: null, isAuthenticated: false });
        }
      },
    }),
    {
      name: 'closet-auth',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? sessionStorage : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage))),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
