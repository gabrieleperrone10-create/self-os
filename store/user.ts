import { create } from 'zustand';
import type { Profile } from '@/types';

interface UserStore {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
}

export const useUserStore = create<UserStore>(set => ({
  profile: null,
  setProfile: profile => set({ profile }),
}));
