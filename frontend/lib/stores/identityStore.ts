import { create } from 'zustand';

export interface IdentityRecord {
  displayName: string;
  role: 'patient' | 'doctor' | 'family' | 'unknown';
  specialisation?: string;
  hospital?: string;
  medicalRegistration?: string;
  avatarSeed?: string;
  isKnown: boolean;
}

interface IdentityStore {
  cache: Record<string, IdentityRecord>;
  setIdentity: (address: string, record: IdentityRecord) => void;
}

export const useIdentityStore = create<IdentityStore>((set) => ({
  cache: {},
  setIdentity: (address, record) =>
    set((s) => ({ cache: { ...s.cache, [address.toLowerCase()]: record } })),
}));
