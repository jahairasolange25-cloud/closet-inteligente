import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Avatar, GenerationStatus } from '@/types/avatar';

interface AvatarState {
  avatar: Avatar | null;
  generationId: string | null;
  generationStatus: GenerationStatus;

  setAvatar: (avatar: Avatar) => void;
  setGenerationId: (id: string) => void;
  setGenerationStatus: (status: GenerationStatus) => void;
  reset: () => void;
}

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set) => ({
      avatar: null,
      generationId: null,
      generationStatus: 'idle',

      setAvatar: (avatar) => set({ avatar }),
      setGenerationId: (id) => set({ generationId: id }),
      setGenerationStatus: (status) => set({ generationStatus: status }),
      reset: () => set({ avatar: null, generationId: null, generationStatus: 'idle' }),
    }),
    {
      name: 'closet-avatar',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage),
      ),
    },
  ),
);
