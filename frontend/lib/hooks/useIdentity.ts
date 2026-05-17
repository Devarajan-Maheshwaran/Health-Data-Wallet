'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  wallet_address: string;
  display_name: string;
  role: 'patient' | 'doctor' | 'family';
  specialisation?: string;
  hospital?: string;
  phone?: string;
  email?: string;
  avatar_seed?: string;
  medical_registration?: string;
}

// Session-scoped cache to avoid hitting Supabase or localStorage repeatedly
const identityCache: Record<string, UserProfile> = {};

// Hardcoded sample profiles for standard hackathon demo mode (matching spec: Arvind Raman, Dr. Ethan Clarke)
const SAMPLE_PROFILES: Record<string, UserProfile> = {
  '0x742d35Cc6634C0532925a3b844Bc454e4438f44e': {
    wallet_address: '0x742d35cc6634c0532925a3b844bc454e4438f44e',
    display_name: 'Dr. Ethan Clarke',
    role: 'doctor',
    specialisation: 'Diabetologist',
    hospital: 'Apollo Hospital',
    phone: '+91-90000-00000',
    email: 'dr.ethan@apollo.com',
    avatar_seed: 'ethan',
    medical_registration: 'MCI-182749'
  },
  '0x0000000000000000000000000000000000000000': {
    wallet_address: '0x0000000000000000000000000000000000000000',
    display_name: 'Admin Guardian',
    role: 'patient',
    avatar_seed: 'admin'
  }
};

export function useIdentity(address: string | undefined) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const cleanAddr = address?.toLowerCase() || '';

  useEffect(() => {
    if (!cleanAddr) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    // 1. Check local session cache first
    if (identityCache[cleanAddr]) {
      setProfile(identityCache[cleanAddr]);
      setIsLoading(false);
      return;
    }

    // 2. Check hardcoded sample profiles (for demo reliability)
    const matchingKey = Object.keys(SAMPLE_PROFILES).find(k => k.toLowerCase() === cleanAddr);
    if (matchingKey) {
      const p = SAMPLE_PROFILES[matchingKey];
      identityCache[cleanAddr] = p;
      setProfile(p);
      setIsLoading(false);
      return;
    }

    const fetchIdentity = async () => {
      setIsLoading(true);

      // 3. Try to query Supabase profiles table
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('wallet_address', cleanAddr)
            .maybeSingle();

          if (data && !error) {
            const p = data as UserProfile;
            identityCache[cleanAddr] = p;
            setProfile(p);
            setIsLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Supabase profile query bypassed', err);
        }
      }

      // 4. Fallback to LocalStorage cache (stores user profiles dynamically saved on this browser)
      const localProfilesStr = localStorage.getItem('medvault_local_profiles') || '{}';
      const localProfiles = JSON.parse(localProfilesStr);
      if (localProfiles[cleanAddr]) {
        const p = localProfiles[cleanAddr] as UserProfile;
        identityCache[cleanAddr] = p;
        setProfile(p);
        setIsLoading(false);
        return;
      }

      // 5. Generate default dynamic profile if still unknown
      const defaultProfile: UserProfile = {
        wallet_address: cleanAddr,
        display_name: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '',
        role: 'patient',
        avatar_seed: cleanAddr
      };
      setProfile(defaultProfile);
      setIsLoading(false);
    };

    fetchIdentity();
  }, [cleanAddr, address]);

  // Dicebear Bottts avatar generator
  const avatarUrl = profile?.avatar_seed
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.avatar_seed}`
    : `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanAddr || 'default'}`;

  return {
    displayName: profile?.display_name || address ? `${address!.slice(0, 6)}...${address!.slice(-4)}` : 'Unknown Address',
    role: profile?.role || 'patient',
    specialisation: profile?.specialisation || '',
    hospital: profile?.hospital || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
    medicalRegistration: profile?.medical_registration || '',
    isKnown: !!profile?.specialisation || (profile?.display_name !== undefined && profile?.display_name.slice(0, 2) !== '0x'),
    avatarUrl,
    profile,
    isLoading
  };
}
