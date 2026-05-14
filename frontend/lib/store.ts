import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserStore {
  // SIWE auth state
  isAuthenticated: boolean;
  address: string | null;
  // Registration state
  isRegistered: boolean;
  displayName: string | null;
  // Actions
  setAuthenticated: (address: string) => void;
  setRegistered: (name: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      address: null,
      isRegistered: false,
      displayName: null,
      setAuthenticated: (address) => set({ isAuthenticated: true, address }),
      setRegistered: (name) => set({ isRegistered: true, displayName: name }),
      logout: () => set({ isAuthenticated: false, address: null, isRegistered: false, displayName: null }),
    }),
    { name: 'medvault-user' }
  )
);

// AI model loading state (not persisted)
interface AIStore {
  nerLoaded: boolean;
  classifierLoaded: boolean;
  embeddingLoaded: boolean;
  generatorLoaded: boolean;
  setModelLoaded: (model: 'ner' | 'classifier' | 'embedding' | 'generator') => void;
}

export const useAIStore = create<AIStore>((set) => ({
  nerLoaded: false,
  classifierLoaded: false,
  embeddingLoaded: false,
  generatorLoaded: false,
  setModelLoaded: (model) => set({
    nerLoaded:        model === 'ner'        ? true : undefined,
    classifierLoaded: model === 'classifier' ? true : undefined,
    embeddingLoaded:  model === 'embedding'  ? true : undefined,
    generatorLoaded:  model === 'generator'  ? true : undefined,
  } as Partial<AIStore>),
}));
