import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'patient' | 'provider' | null

interface SiweSession {
  address: string
  chainId: number
  issuedAt: string
}

interface AppState {
  // Auth
  session: SiweSession | null
  role: UserRole
  setSession: (s: SiweSession | null) => void
  setRole: (r: UserRole) => void
  clearSession: () => void

  // AES encryption key (in-memory only, never persisted)
  aesKey: CryptoKey | null
  setAesKey: (k: CryptoKey | null) => void

  // UI
  sidebarOpen: boolean
  setSidebarOpen: (v: boolean) => void

  // AI model loading status
  modelsReady: {
    ner: boolean
    classifier: boolean
    embedder: boolean
    generator: boolean
  }
  setModelReady: (model: keyof AppState['modelsReady'], ready: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      session: null,
      role: null,
      setSession: (s) => set({ session: s }),
      setRole:    (r) => set({ role: r }),
      clearSession: () => set({ session: null, role: null, aesKey: null }),

      // aesKey is deliberately NOT persisted (only in memory)
      aesKey: null,
      setAesKey: (k) => set({ aesKey: k }),

      sidebarOpen: true,
      setSidebarOpen: (v) => set({ sidebarOpen: v }),

      modelsReady: { ner: false, classifier: false, embedder: false, generator: false },
      setModelReady: (model, ready) =>
        set((s) => ({ modelsReady: { ...s.modelsReady, [model]: ready } })),
    }),
    {
      name: 'medvault-app',
      // Only persist non-sensitive fields
      partialize: (s) => ({ session: s.session, role: s.role, sidebarOpen: s.sidebarOpen }),
    }
  )
)
