'use client';
import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Routes that do NOT require a wallet/profile
const PUBLIC_ROUTES = ['/', '/docs'];
// Routes accessible to emergency responders (no wallet needed)
const EMERGENCY_PATTERN = /^\/emergency\/0x[a-fA-F0-9]+/;

export function AuthGate() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const checkedRef = useRef<string | null>(null);

  useEffect(() => {
    // Allow emergency QR scan pages always (no wallet needed for public scans)
    if (EMERGENCY_PATTERN.test(pathname)) return;

    // If not connected and on a protected route, send home
    if (!isConnected && !PUBLIC_ROUTES.includes(pathname)) {
      router.replace('/');
      return;
    }

    // If connected and on home page, check if profile exists → redirect to dashboard
    if (isConnected && address && pathname === '/') {
      const cleanAddr = address.toLowerCase();

      // Avoid rechecking the same address multiple times
      if (checkedRef.current === cleanAddr) return;
      checkedRef.current = cleanAddr;

      const checkProfile = async () => {
        // 1. Check Supabase
        if (supabase) {
          const { data } = await supabase
            .from('profiles')
            .select('wallet_address')
            .eq('wallet_address', cleanAddr)
            .maybeSingle();

          if (data) {
            // Profile exists → load name into localStorage and go to dashboard
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
              // Cache full profile in local profiles map too
              const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
              local[cleanAddr] = { wallet_address: cleanAddr, ...fullProfile };
              localStorage.setItem('medvault_local_profiles', JSON.stringify(local));
              window.dispatchEvent(new Event('medvault_profile_updated'));
            }
            router.replace('/dashboard');
            return;
          }
        }

        // 2. Supabase unavailable — check localStorage
        const local = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
        if (local[cleanAddr]) {
          router.replace('/dashboard');
        }
        // If neither exists, OnboardingSheet will show automatically — do nothing here
      };

      checkProfile();
    }
  }, [isConnected, address, pathname, router]);

  return null; // Pure logic component, renders nothing
}
