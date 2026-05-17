import { createClient } from '@supabase/supabase-js';
import { Shield, AlertTriangle, Phone, Droplets, Pill, Stethoscope, Heart, User, AlertCircle } from 'lucide-react';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function getProfile(address: string) {
  try {
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data } = await sb
      .from('profiles')
      .select('display_name, blood_group, phone, email, emergency_card, emergency_contacts')
      .eq('wallet_address', address.toLowerCase())
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export default async function EmergencyCardPage({
  params,
}: {
  params: { address: string };
}) {
  const profile = await getProfile(params.address);

  // Merge emergency_contacts from both the top-level column and inside emergency_card JSONB
  // (OnboardingSheet saves to both places for redundancy)
  const card     = profile?.emergency_card as any;
  const contacts: Array<{ name: string; phone: string; relationship: string }> =
    profile?.emergency_contacts ?? card?.emergencyContacts ?? [];

  const bloodGroup = profile?.blood_group || card?.bloodType || null;

  const medFields = [
    {
      icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      label: 'Allergies',
      value: card?.allergies,
      urgent: true,
    },
    {
      icon: <Pill className="h-4 w-4 text-red-400" />,
      label: 'Current Medications',
      value: card?.currentMeds,
      urgent: false,
    },
    {
      icon: <Heart className="h-4 w-4 text-red-400" />,
      label: 'Chronic Conditions',
      value: card?.conditions,
      urgent: false,
    },
    {
      icon: <Stethoscope className="h-4 w-4 text-red-400" />,
      label: 'Treating Doctor',
      value: card?.treatingDoctor,
      urgent: false,
    },
  ].filter(f => f.value);

  const hasAnyData = bloodGroup || medFields.length > 0 || contacts.length > 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #1a0505 0%, #2d0a0a 40%, #1a0505 100%)',
        padding: '0',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* TOP STRIP — pulsing red alert bar */}
      <div
        style={{
          background: 'rgba(220, 38, 38, 0.15)',
          borderBottom: '1px solid rgba(220, 38, 38, 0.3)',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#ef4444',
            display: 'inline-block',
            animation: 'pulse 1.4s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.15em',
            color: '#fca5a5',
            textTransform: 'uppercase',
          }}
        >
          Emergency Medical Information — No Login Required
        </span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* PATIENT IDENTITY CARD */}
        <div
          style={{
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1.5px solid rgba(220, 38, 38, 0.35)',
            borderRadius: 20,
            padding: '20px 20px 16px',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Avatar circle */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(220, 38, 38, 0.2)',
                border: '2px solid rgba(220, 38, 38, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <User className="h-6 w-6 text-red-400" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#ffffff',
                  lineHeight: 1.2,
                  marginBottom: 4,
                }}
              >
                {profile?.display_name ?? 'Unknown Patient'}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  color: 'rgba(252, 165, 165, 0.5)',
                  wordBreak: 'break-all',
                }}
              >
                {params.address}
              </div>
            </div>
          </div>
        </div>

        {!hasAnyData && (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              padding: '28px 20px',
              textAlign: 'center',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
              Emergency profile not yet configured
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.5 }}>
              This person has not filled in their emergency medical information yet.
              Please contact them or their family directly.
            </div>
            {profile?.phone && (
              <a
                href={`tel:${profile.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 16,
                  background: 'rgba(220,38,38,0.2)',
                  border: '1px solid rgba(220,38,38,0.4)',
                  borderRadius: 12,
                  padding: '10px 20px',
                  color: '#fca5a5',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                }}
              >
                <Phone className="h-4 w-4" /> Call Patient: {profile.phone}
              </a>
            )}
          </div>
        )}

        {/* BLOOD GROUP + ALLERGIES — most critical, shown first, largest */}
        {(bloodGroup || medFields.find(f => f.urgent)) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: bloodGroup && medFields.find(f => f.urgent) ? '1fr 1fr' : '1fr',
              gap: 12,
              marginBottom: 12,
            }}
          >
            {bloodGroup && (
              <div
                style={{
                  background: 'rgba(220, 38, 38, 0.15)',
                  border: '1.5px solid rgba(220, 38, 38, 0.5)',
                  borderRadius: 16,
                  padding: '16px 14px',
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                  <Droplets className="h-7 w-7 text-red-500" />
                </div>
                <div
                  style={{
                    fontSize: 32,
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-0.02em',
                    lineHeight: 1,
                  }}
                >
                  {bloodGroup}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(252,165,165,0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginTop: 4,
                  }}
                >
                  Blood Type
                </div>
              </div>
            )}

            {medFields.find(f => f.urgent) && (
              <div
                style={{
                  background: 'rgba(234, 179, 8, 0.08)',
                  border: '1.5px solid rgba(234, 179, 8, 0.35)',
                  borderRadius: 16,
                  padding: '16px 14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: 'rgba(253,224,71,0.6)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Allergies
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#fef08a',
                    lineHeight: 1.4,
                  }}
                >
                  {medFields.find(f => f.urgent)?.value}
                </div>
              </div>
            )}
          </div>
        )}

        {/* OTHER MEDICAL FIELDS */}
        {medFields.filter(f => !f.urgent).length > 0 && (
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            {medFields.filter(f => !f.urgent).map((field, i, arr) => (
              <div
                key={field.label}
                style={{
                  padding: '14px 18px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    color: 'rgba(252,165,165,0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: 4,
                  }}
                >
                  {field.icon} <span>{field.label}</span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4 }}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMERGENCY CONTACTS — tap to call */}
        {contacts.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(252,165,165,0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginBottom: 10,
                paddingLeft: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Phone className="h-3.5 w-3.5 text-red-400" />
              <span>Emergency Contacts — Tap to Call</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {contacts.map((c, i) => (
                <a
                  key={i}
                  href={`tel:${c.phone}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1.5px solid rgba(220, 38, 38, 0.3)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#ffffff',
                        marginBottom: 2,
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'rgba(252,165,165,0.6)',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                      }}
                    >
                      {c.relationship}
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(220,38,38,0.25)',
                      border: '1px solid rgba(220,38,38,0.5)',
                      borderRadius: 10,
                      padding: '8px 14px',
                      color: '#fca5a5',
                      fontSize: 13,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <Phone className="h-3.5 w-3.5 text-red-300" /> {c.phone}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 28,
            padding: '14px 20px',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
          }}
        >
          <Shield className="h-4 w-4 text-slate-500" />
          <span
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.25)',
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            Secured by MedVault · Blockchain-verified health records
          </span>
        </div>

        {/* Inline CSS for pulse animation */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.85); }
          }
        `}</style>
      </div>
    </div>
  );
}
