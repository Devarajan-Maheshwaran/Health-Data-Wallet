-- MedVault — Supabase Database Schema
-- Run this in the Supabase SQL editor to initialize the database.
-- NOTE: record_metadata_cache was intentionally removed.
--       AI-extracted medical data (diseases, drugs, symptoms) is stored
--       exclusively in the user's browser IndexedDB and never sent to any server.
--       Cross-device access is handled via wallet re-authentication (SIWE) +
--       re-download and re-index from BNB Greenfield on login.
--
-- IDEMPOTENT: Safe to re-run. Tables, indexes, and policies use IF NOT EXISTS.
-- Policies use DROP IF EXISTS before CREATE to avoid duplicate-policy errors.


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

CREATE INDEX IF NOT EXISTS idx_access_requests_patient    ON access_requests(patient_address);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester  ON access_requests(requester_address);
CREATE INDEX IF NOT EXISTS idx_access_requests_status     ON access_requests(status);


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
CREATE INDEX IF NOT EXISTS idx_notifications_read      ON notifications(recipient_address, read);


-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE providers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications   ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- RLS Policies
-- All API routes use the service_role key which bypasses RLS.
-- These policies cover direct Data API / anon key access.
-- DROP IF EXISTS makes this script safe to re-run.
-- ============================================================

-- Providers: anyone can read verified providers (public directory)
DROP POLICY IF EXISTS "public read verified providers" ON providers;
CREATE POLICY "public read verified providers" ON providers
    FOR SELECT USING (verified = true);

-- Access requests: open policy — API-layer (service_role) is the real gating
DROP POLICY IF EXISTS "allow all access_requests" ON access_requests;
CREATE POLICY "allow all access_requests" ON access_requests
    FOR ALL USING (true) WITH CHECK (true);

-- Notifications: open policy — API-layer (service_role) is the real gating
DROP POLICY IF EXISTS "own notifications" ON notifications;
CREATE POLICY "own notifications" ON notifications
    FOR ALL USING (true);
