import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types mirroring the Supabase schema
export interface Provider {
  id: string;
  wallet_address: string;
  name: string;
  specialty?: string;
  hospital?: string;
  license_number?: string;
  verified: boolean;
  registered_at: string;
}

export interface AccessRequest {
  id: string;
  patient_address: string;
  requester_address: string;
  tier: string;
  record_ids: number[];
  duration_seconds?: number;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requested_at: string;
  resolved_at?: string;
}

export interface Notification {
  id: string;
  recipient_address: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface RecordMetadataCache {
  id: string;
  patient_address: string;
  record_id: number;
  version: number;
  ai_extracted: Record<string, unknown>;
  document_type: string;
  summary?: string;
  indexed_at: string;
}
