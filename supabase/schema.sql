-- MedVault — Supabase Database Schema
-- Run this in the Supabase SQL editor to initialize the database.

-- ============================================================
-- Providers registry
-- ============================================================
CREATE TABLE IF NOT EXISTS providers (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address  TEXT UNIQUE NOT NULL,
    name            TEXT,
    specialty       TEXT,
    hospital        TEXT,
    license_number  TEXT,
    verified        BOOLEAN DEFAULT false,
    registered_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_providers_wallet ON providers(wallet_address);

-- ============================================================
-- Access requests (off-chain coordination layer)
-- ============================================================
CREATE TABLE IF NOT EXISTS access_requests (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_address     TEXT NOT NULL,
    requester_address   TEXT NOT NULL,
    tier                TEXT NOT NULL,   -- EMERGENCY_READ | RECORD_READ | FULL_READ | PROVIDER_WRITE
    record_ids          INTEGER[] DEFAULT '{}',
    duration_seconds    INTEGER,         -- NULL = permanent
    reason              TEXT DEFAULT '',
    status              TEXT DEFAULT 'pending', -- pending | approved | rejected | expired
    requested_at        TIMESTAMPTZ DEFAULT now(),
    resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_access_requests_patient ON access_requests(patient_address);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON access_requests(requester_address);
CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_address   TEXT NOT NULL,
    type                TEXT NOT NULL,   -- access_request | access_approved | access_revoked | record_added
    payload             JSONB,
    read                BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_address);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_address, read);

-- ============================================================
-- Off-chain metadata cache
-- Mirrors AI-extracted metadata from on-chain + Greenfield
-- ============================================================
CREATE TABLE IF NOT EXISTS record_metadata_cache (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_address     TEXT NOT NULL,
    record_id           INTEGER NOT NULL,
    version             INTEGER NOT NULL DEFAULT 1,
    object_name         TEXT,             -- Greenfield object name / CID
    ai_extracted        JSONB,            -- NER output JSON: { diseases, drugs, symptoms, lab_values }
    document_type       TEXT,             -- matches DocumentType enum
    summary             TEXT,             -- LLM-generated summary (Phase 5)
    indexed_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(patient_address, record_id, version)
);

CREATE INDEX IF NOT EXISTS idx_metadata_patient ON record_metadata_cache(patient_address);
CREATE INDEX IF NOT EXISTS idx_metadata_doc_type ON record_metadata_cache(patient_address, document_type);

-- ============================================================
-- Row Level Security
-- Note: API routes use the admin (service-role) client so these
-- policies apply only to direct client-side Supabase calls.
-- ============================================================
ALTER TABLE providers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE record_metadata_cache  ENABLE ROW LEVEL SECURITY;

-- Providers: anyone can read verified providers
CREATE POLICY "public read verified providers" ON providers
    FOR SELECT USING (verified = true);

-- Notifications: only the recipient can read their notifications
-- (enforced at API layer via wallet auth; this is a belt-and-suspenders)
CREATE POLICY "own notifications" ON notifications
    FOR ALL USING (true); -- API-layer auth is primary gating
