'use client';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Routes that never redirect — no wallet needed
const PUBLIC_ROUTES = ['/', '/docs'];

// Emergency QR scan pages — ALWAYS public, zero wallet required, never redirect
// Matches /emergency/0x... with any casing and any length address
const EMERGENCY_PATTERN = /^\/emergency\//i;

export function AuthGate() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef<string | null>(null);
  // Wait for full hydration before ANY redirect — prevents race condition
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Never do anything until fully hydrated on client
    if (!mounted) return;

    // ALWAYS allow emergency QR pages — no wallet, no redirect, ever
    if (EMERGENCY_PATTERN.test(pathname)) return;

    // Always allow public routes
    if (PUBLIC_ROUTES.includes(pathname)) {
      // If connected on homepage and profile exists → go to dashboard
      if (isConnected && address && pathname === '/') {
        const cleanAddr = address.toLowerCase();
        if (checkedRef.current === cleanAddr) return;
        checkedRef.current = cleanAddr;

        const checkProfile = async () => {
          if (supabase) {
            const { data } = await supabase
              .from('profiles')
              .select('wallet_address')
              .eq('wallet_address', cleanAddr)
              .maybeSingle();

            if (data) {
              const { data: fullProfile } = await supabase
                .from('profiles')
                .select('display_name, role, phone, email, blood_group, emergency_contacts')
                .eq('wallet_address', cleanAddr)
                .maybeSingle();

              if (fullProfile) {
                localStorage.setItem('medvault_username', fullProfile.display_name || '');
                localStorage.setItem('medvault_role', fullProfile.role || 'patient');
                localStorage.setItem('medvault_phone', fullProfile.phone || '');
                localStorage.setItem('medvault_email', fullProfile.email || '');
                const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
                local[cleanAddr] = { wallet_address: cleanAddr, ...fullProfile };
                localStorage.setItem('medvault_local_profiles', JSON.stringify(local));
                window.dispatchEvent(new Event('medvault_profile_updated'));
              }
              router.replace('/dashboard');
              return;
            }
          }

          const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
          if (local[cleanAddr]) {
            router.replace('/dashboard');
          }
        };

        checkProfile();
      }
      return;
    }

    // Protected route + wallet not connected → send home
    if (!isConnected) {
      router.replace('/');
    }
  }, [mounted, isConnected, address, pathname, router]);

  return null;
}
