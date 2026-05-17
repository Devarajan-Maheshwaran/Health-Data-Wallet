'use client';

import { useEffect, useState } from 'react';
import { useIdentityStore } from '@/lib/stores/identityStore';
import { supabase } from '@/lib/supabase';

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export interface IdentityRecord {
  displayName: string;
  role: 'patient' | 'doctor' | 'family' | 'unknown';
  specialisation?: string;
  hospital?: string;
  medicalRegistration?: string;
  avatarSeed?: string;
  isKnown: boolean;
}

export function useIdentity(address: string | undefined) {
  const { cache, setIdentity } = useIdentityStore();
  const [loading, setLoading] = useState(false);
  const key = address?.toLowerCase();

  useEffect(() => {
    if (!key || cache[key]) return;
    setLoading(true);

    if (key.length < 10) {
      setIdentity(key, { displayName: key, role: 'unknown', isKnown: false });
      setLoading(false);
      return;
    }

    if (!supabase) {
      setIdentity(key, {
        displayName: shortenAddress(key),
        role: 'unknown',
        isKnown: false,
      });
      setLoading(false);
      return;
    }

    supabase
      .from('profiles')
      .select('display_name, role, specialisation, hospital, medical_registration, avatar_seed')
      .eq('wallet_address', key)
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (data && !error) {
          setIdentity(key, {
            displayName: data.display_name,
            role: data.role as any,
            specialisation: data.specialisation || '',
            hospital: data.hospital || '',
            medicalRegistration: data.medical_registration || '',
            avatarSeed: data.avatar_seed || key,
            isKnown: true,
          });
        } else {
          // Check localStorage as robust backup for offline testing
          const localProfilesStr = localStorage.getItem('medvault_local_profiles') || '{}';
          const localProfiles = JSON.parse(localProfilesStr);
          if (localProfiles[key]) {
            const lp = localProfiles[key];
            setIdentity(key, {
              displayName: lp.display_name,
              role: lp.role,
              specialisation: lp.specialisation || '',
              hospital: lp.hospital || '',
              medicalRegistration: lp.medical_registration || '',
              avatarSeed: lp.avatar_seed || key,
              isKnown: true,
            });
          } else {
            setIdentity(key, {
              displayName: shortenAddress(key),
              role: 'unknown',
              isKnown: false,
            });
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setIdentity(key, {
          displayName: shortenAddress(key),
          role: 'unknown',
          isKnown: false,
        });
        setLoading(false);
      });
  }, [key, cache, setIdentity]);

  const record = key ? cache[key] : undefined;

  // Dicebear Bottts/identicon avatar URL fallback
  const avatarUrl = record?.avatarSeed
    ? `https://api.dicebear.com/7.x/identicon/svg?seed=${record.avatarSeed}`
    : `https://api.dicebear.com/7.x/identicon/svg?seed=${key || 'default'}`;

  return {
    displayName: record?.displayName || (key ? shortenAddress(key) : '—'),
    role: record?.role || 'unknown',
    specialisation: record?.specialisation || '',
    hospital: record?.hospital || '',
    medicalRegistration: record?.medicalRegistration || '',
    isKnown: record?.isKnown || false,
    loading,
    avatarUrl,
    shortAddress: key ? shortenAddress(key) : '—',
  };
}
