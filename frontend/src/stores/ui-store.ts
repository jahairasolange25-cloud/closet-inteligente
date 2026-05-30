import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  isSidebarOpen: boolean;
  isSidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  activeModal: string | null;
  toasts: Toast[];
  isOffline: boolean;

  toggleSidebar: () => void;
  collapseSidebar: (collapsed: boolean) => void;
  toggleMobileMenu: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setOffline: (isOffline: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isSidebarOpen: true,
      isSidebarCollapsed: false,
      isMobileMenuOpen: false,
      theme: 'system',
      activeModal: null,
      toasts: [],
      isOffline: false,

      toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
      collapseSidebar: (collapsed) => set({ isSidebarCollapsed: collapsed }),
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      setTheme: (theme) => set({ theme }),
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),

      addToast: (toast) =>
        set((s) => ({
          toasts: [
            ...s.toasts,
            { ...toast, id: `${Date.now()}-${Math.random().toString(36).slice(2)}` },
          ],
        })),

      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      setOffline: (isOffline) => set({ isOffline }),
    }),
    {
      name: 'closet-ui',
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage)),
      partialize: (s) => ({ theme: s.theme, isSidebarCollapsed: s.isSidebarCollapsed }),
    },
  ),
);
