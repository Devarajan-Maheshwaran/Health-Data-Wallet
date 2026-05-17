'use client';

import { useState } from 'react';
import { useIdentity } from '@/lib/hooks/useIdentity';
import { Eye, EyeOff, Plus, Check, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface IdentityBadgeProps {
  address: string | undefined;
  showToggle?: boolean;
}

export function IdentityBadge({ address, showToggle = true }: IdentityBadgeProps) {
  const { displayName, role, specialisation, hospital, avatarUrl, isKnown, medicalRegistration } = useIdentity(address);
  const [showAddress, setShowAddress] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [addedContact, setAddedContact] = useState(false);

  if (!address) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAddress(!showAddress);
  };

  const handleAddContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Add to Local Storage contact book for mock indexing demo
    const cleanAddr = address.toLowerCase();
    const currentContactsStr = localStorage.getItem('medvault_local_contacts') || '{}';
    const contacts = JSON.parse(currentContactsStr);
    
    contacts[cleanAddr] = {
      wallet_address: cleanAddr,
      display_name: isKnown ? displayName : `Contact ${address.slice(0, 6)}`,
      role: 'doctor',
      hospital: 'General Hospital',
      relationship: 'doctor'
    };
    
    localStorage.setItem('medvault_local_contacts', JSON.stringify(contacts));
    setAddedContact(true);
    setTimeout(() => setAddedContact(false), 2000);
  };

  const roleEmoji = role === 'doctor' ? '🩺' : role === 'family' ? '🏠' : '💊';

  return (
    <div 
      className="relative inline-block text-left"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center gap-2 bg-[#111518]/90 border border-white/10 hover:border-sky-500/30 rounded-full px-3 py-1.5 transition-all text-xs text-white/90 shadow-lg">
        
        {/* Avatar */}
        <img 
          src={avatarUrl} 
          alt="avatar" 
          className="w-4 h-4 rounded-full bg-white/10 shrink-0 object-cover" 
        />
        
        {/* Name / Address flip animation */}
        <span className="font-semibold select-none flex items-center gap-1 font-mono">
          {showAddress ? (
            <span className="text-sky-400 font-bold">{address.slice(0, 6)}...{address.slice(-4)}</span>
          ) : (
            <span className="font-sans font-bold">
              {isKnown && <span className="mr-1">{roleEmoji}</span>}
              {displayName}
            </span>
          )}
        </span>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 ml-1 border-l border-white/10 pl-1.5">
          {showToggle && (
            <button 
              onClick={handleToggle}
              className="text-slate-400 hover:text-sky-400 transition-colors p-0.5 rounded-full hover:bg-white/10"
              title={showAddress ? "Show Display Name" : "Reveal Wallet Address"}
            >
              {showAddress ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}

          {!isKnown && (
            <button
              onClick={handleAddContact}
              className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded-full hover:bg-white/10"
              title="Add to Contacts"
            >
              {addedContact ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Floating Hover Card Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 w-64 bg-[#111518] border border-white/10 p-4 rounded-2xl shadow-2xl z-50 space-y-2.5 backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full bg-white/10" />
              <div>
                <h4 className="font-syne text-sm font-bold text-white leading-tight">{displayName}</h4>
                <span className="inline-block text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1.5">
                  {role}
                </span>
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            <div className="space-y-1 text-[11px] text-slate-400 leading-normal">
              <p className="flex justify-between">
                <span className="font-semibold text-slate-500">Address:</span>
                <span className="font-mono text-slate-300">{address.slice(0, 8)}...{address.slice(-6)}</span>
              </p>
              {role === 'doctor' && (
                <>
                  {specialisation && (
                    <p className="flex justify-between">
                      <span className="font-semibold text-slate-500">Specialisation:</span>
                      <span className="text-slate-300">{specialisation}</span>
                    </p>
                  )}
                  {hospital && (
                    <p className="flex justify-between">
                      <span className="font-semibold text-slate-500">Hospital:</span>
                      <span className="text-slate-300">{hospital}</span>
                    </p>
                  )}
                  {medicalRegistration && (
                    <p className="flex justify-between items-center bg-emerald-500/5 border border-emerald-500/10 px-1.5 py-0.5 rounded mt-1">
                      <span className="font-semibold text-emerald-500 flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Verified Provider:</span>
                      <span className="text-emerald-400 font-bold">{medicalRegistration}</span>
                    </p>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
