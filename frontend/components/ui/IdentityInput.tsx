'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAccount } from 'wagmi';

interface ContactSuggestion {
  wallet: string;
  nickname: string;
  role: string;
  specialisation?: string;
}

interface Props {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  focusColor?: 'teal' | 'rose';
}

export function IdentityInput({ value, onChange, placeholder = '0x... or search by name', focusColor = 'teal' }: Props) {
  const { address: myAddress } = useAccount();
  const [suggestions, setSuggestions] = useState<ContactSuggestion[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!myAddress || value.length < 2) { 
      setSuggestions([]); 
      return; 
    }

    if (!supabase) {
      // Fallback: search local profile cache
      try {
        const localProfiles = JSON.parse(localStorage.getItem('medvault_local_profiles') || '{}');
        const matches = Object.values(localProfiles).filter((p: any) =>
          p.display_name?.toLowerCase().includes(value.toLowerCase())
        ).slice(0, 5) as any[];
        setSuggestions(matches.map((p: any) => ({
          wallet: p.wallet_address,
          nickname: p.display_name,
          role: p.role,
          specialisation: p.specialisation,
        })));
      } catch {}
      return;
    }

    // Search contact_book for this user by nickname
    supabase
      .from('contact_book')
      .select('contact_wallet, nickname, relationship')
      .eq('owner_wallet', myAddress.toLowerCase())
      .ilike('nickname', `%${value}%`)
      .limit(5)
      .then(({ data: contacts, error }: any) => {
        if (!contacts?.length || error) {
          // Fallback: search profiles by display_name
          supabase
            .from('profiles')
            .select('wallet_address, display_name, role, specialisation')
            .ilike('display_name', `%${value}%`)
            .limit(5)
            .then(({ data: profiles }: any) => {
              setSuggestions((profiles ?? []).map((p: any) => ({
                wallet: p.wallet_address,
                nickname: p.display_name,
                role: p.role,
                specialisation: p.specialisation || undefined,
              })));
            });
        } else {
          setSuggestions(contacts.map((c: any) => ({
            wallet: c.contact_wallet,
            nickname: c.nickname,
            role: c.relationship,
          })));
        }
      });
  }, [value, myAddress]);

  const borderFocus = focusColor === 'rose'
    ? 'focus:border-rose-500/50 focus:ring-rose-500/50'
    : 'focus:border-teal-400/50 focus:ring-teal-400/50';

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onFocus={() => setOpen(true)}
        className={`w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:ring-1 transition-all ${borderFocus} text-sm font-medium`}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-[#111518] border border-white/10 rounded-xl overflow-hidden z-[100] shadow-2xl backdrop-blur-md">
          {suggestions.map(s => (
            <button
              key={s.wallet}
              type="button"
              onMouseDown={() => { onChange(s.wallet); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
            >
              <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-400 text-xs font-bold shrink-0">
                {s.nickname[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white text-xs font-bold truncate">{s.nickname}</p>
                <p className="text-slate-500 text-[10px] font-mono truncate">{s.wallet}</p>
              </div>
              {s.role === 'doctor' && (
                <span className="shrink-0 text-[10px] bg-sky-500/10 text-sky-400 px-2 py-0.5 rounded-full font-semibold">
                  {s.specialisation ?? 'Doctor'}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
