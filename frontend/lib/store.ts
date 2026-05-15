import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── User / Auth Store ────────────────────────────────────────────────────────
interface UserStore {
  isAuthenticated: boolean;
  address:         string | null;
  isRegistered:    boolean;
  displayName:     string | null;
  setAuthenticated: (address: string) => void;
  setRegistered:    (name: string) => void;
  logout:           () => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      address:         null,
      isRegistered:    false,
      displayName:     null,
      setAuthenticated: (address) => set({ isAuthenticated: true, address }),
      setRegistered:    (name)    => set({ isRegistered: true, displayName: name }),
      logout:           ()        => set({ isAuthenticated: false, address: null, isRegistered: false, displayName: null }),
    }),
    { name: 'medvault-user' }
  )
);

// ─── AI Model Loading State (not persisted) ───────────────────────────────────
interface AIStore {
  nerLoaded:        boolean;
  classifierLoaded: boolean;
  embeddingLoaded:  boolean;
  generatorLoaded:  boolean;
  setModelLoaded:   (model: 'ner' | 'classifier' | 'embedding' | 'generator') => void;
}

export const useAIStore = create<AIStore>((set) => ({
  nerLoaded:        false,
  classifierLoaded: false,
  embeddingLoaded:  false,
  generatorLoaded:  false,
  // FIX: use spread to avoid partial state overwrite bug
  setModelLoaded: (model) =>
    set(state => ({
      ...state,
      nerLoaded:        model === 'ner'        ? true : state.nerLoaded,
      classifierLoaded: model === 'classifier' ? true : state.classifierLoaded,
      embeddingLoaded:  model === 'embedding'  ? true : state.embeddingLoaded,
      generatorLoaded:  model === 'generator'  ? true : state.generatorLoaded,
    })),
}));
