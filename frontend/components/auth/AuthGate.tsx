'use client';
import { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// All routes that must NEVER redirect — no wallet needed
const PUBLIC_ROUTES = ['/', '/docs'];

// Pattern for emergency QR scan pages — always public, no wallet required
const EMERGENCY_PATTERN = /^\/emergency\/0x[a-fA-F0-9]{10,}/i;

export function AuthGate() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Wait for full client-side hydration before doing ANY redirect logic.
  // This prevents the race condition where pathname is wrong on first render.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // CRITICAL: Do nothing until fully hydrated
    if (!mounted) return;

    // CRITICAL: Emergency QR pages are ALWAYS public — never redirect, never block
    if (EMERGENCY_PATTERN.test(pathname)) return;

    // Public routes — always allowed
    if (PUBLIC_ROUTES.includes(pathname)) {
      // But if connected + on homepage + has profile → redirect to dashboard
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

    // Protected route + not connected → send home
    if (!isConnected) {
      router.replace('/');
    }
  }, [mounted, isConnected, address, pathname, router]);

  return null;
}
