-- ==============================================================================
-- Migration: 001_initial_schema_and_roles.sql
-- Description: Core tables, enums, constraints, and audit tables for BallR (ProspekBola)
-- Kepatuhan: UU PDP No. 27/2022 Pasal 25 (Pemrosesan Data Pribadi Anak oleh Wali)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. Academies Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    city TEXT,
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Academy Accreditations Table
-- Holds verifiable federation records (e.g. Asprov PSSI / PSSI Pusat).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academy_accreditations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    accreditation_body TEXT NOT NULL, -- e.g. 'Asprov PSSI D.I. Yogyakarta'
    registration_number TEXT NOT NULL UNIQUE, -- e.g. 'DIY/SSB-2024/048'
    issued_date DATE NOT NULL,
    expiry_date DATE,
    source_url TEXT, -- Verification link or document url
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accreditations_academy_id ON public.academy_accreditations(academy_id);

-- -----------------------------------------------------------------------------
-- 3. Profiles Table (Linked to Supabase auth.users)
-- Roles: 'admin', 'coach', 'parent'
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'coach', 'parent')),
    academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_academy_id ON public.profiles(academy_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -----------------------------------------------------------------------------
-- 4. Players Table
-- Visibility Tiers:
--   'private'  : Default, accessible only by guardians, coaches of the academy, and admin.
--   'academy'  : Accessible by any verified coach/staff within the academy.
--   'link'     : Accessible via unguessable expiring share_token.
--   'public'   : Minimal data visible to scouts / public (nickname, position, age group).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    public_id TEXT NOT NULL UNIQUE, -- e.g. 'WK-2026-0042'
    academy_id UUID REFERENCES public.academies(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    nickname TEXT NOT NULL,
    jersey_number INTEGER NOT NULL DEFAULT 10,
    position TEXT NOT NULL DEFAULT 'Gelandang Serang (CAM)',
    age_group TEXT NOT NULL DEFAULT 'U-13',
    birth_date DATE,
    nisn TEXT,
    height_cm NUMERIC(5, 1),
    weight_kg NUMERIC(5, 1),
    preferred_foot TEXT DEFAULT 'Kanan',
    photo_url TEXT,
    ovr_rating INTEGER NOT NULL DEFAULT 75,
    visibility_tier TEXT NOT NULL DEFAULT 'private' CHECK (visibility_tier IN ('private', 'academy', 'link', 'public')),
    share_token TEXT UNIQUE,
    share_token_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_players_academy_id ON public.players(academy_id);
CREATE INDEX IF NOT EXISTS idx_players_public_id ON public.players(public_id);
CREATE INDEX IF NOT EXISTS idx_players_visibility_tier ON public.players(visibility_tier);
CREATE INDEX IF NOT EXISTS idx_players_share_token ON public.players(share_token);

-- -----------------------------------------------------------------------------
-- 5. Guardians Table
-- Connects a child player to their parent / legal guardian profile.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL DEFAULT 'parent' CHECK (relationship IN ('father', 'mother', 'legal_guardian', 'parent')),
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (player_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_guardians_player_id ON public.guardians(player_id);
CREATE INDEX IF NOT EXISTS idx_guardians_profile_id ON public.guardians(profile_id);

-- -----------------------------------------------------------------------------
-- 6. Consents Table (UU PDP No. 27/2022 Pasal 25)
-- Explicit parental consent with granular purposes, versioning, and revocation tracking.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    purposes JSONB NOT NULL DEFAULT '{
      "training_analysis": true,
      "share_with_scouts": false,
      "public_profile": false,
      "media": false
    }'::jsonb,
    version TEXT NOT NULL DEFAULT 'v1.0-2026-10',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_consents_player_id ON public.consents(player_id);
CREATE INDEX IF NOT EXISTS idx_consents_guardian_id ON public.consents(guardian_id);

-- -----------------------------------------------------------------------------
-- 7. Player Assessments Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    period_month TEXT NOT NULL, -- e.g. 'Oktober 2026'
    coach_name TEXT NOT NULL,
    pace INTEGER NOT NULL DEFAULT 75,
    shooting INTEGER NOT NULL DEFAULT 75,
    passing INTEGER NOT NULL DEFAULT 75,
    dribbling INTEGER NOT NULL DEFAULT 75,
    defending INTEGER NOT NULL DEFAULT 75,
    physical INTEGER NOT NULL DEFAULT 75,
    coach_raw_notes TEXT DEFAULT '',
    ai_narrative TEXT DEFAULT '',
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    growth_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommended_drill JSONB NOT NULL DEFAULT '{
      "title": "Wall-Pass & Quick Scanning Drill",
      "duration": "15 Menit / Hari",
      "category": "Ball Mastery"
    }'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(player_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_assessments_player_id ON public.player_assessments(player_id);

-- -----------------------------------------------------------------------------
-- 8. Fitness Records Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fitness_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vertical_jump_cm NUMERIC(5, 2),
    sprint_20m_sec NUMERIC(5, 2),
    shuttle_run_sec NUMERIC(5, 2),
    yoyo_score TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fitness_player_id ON public.fitness_records(player_id);

-- -----------------------------------------------------------------------------
-- 9. Video Highlights Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.video_highlights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    match_opponent TEXT,
    match_minute INTEGER,
    event_type TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_highlights_player_id ON public.video_highlights(player_id);

-- -----------------------------------------------------------------------------
-- 10. Passport Snapshots Table (Cryptographic Integrity Hashes)
-- Stores canonical payload and SHA-256 hash when an assessment or passport is published.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.passport_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    period_month TEXT NOT NULL,
    snapshot_hash TEXT NOT NULL, -- SHA-256 lowercase hex
    canonical_payload JSONB NOT NULL,
    payload_version TEXT NOT NULL DEFAULT 'v1',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (player_id, period_month)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_player_id ON public.passport_snapshots(player_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_hash ON public.passport_snapshots(snapshot_hash);

-- -----------------------------------------------------------------------------
-- 11. Access Log Table (Append-Only Audit Trail)
-- Tracks views, exports, and consent changes for minor data governance.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'view', 'export', 'revoke_consent', 'grant_consent', 'update_assessment', 'publish_snapshot'
    columns_viewed JSONB,
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_access_log_player_id ON public.access_log(player_id);
CREATE INDEX IF NOT EXISTS idx_access_log_actor ON public.access_log(actor_profile_id);
CREATE INDEX IF NOT EXISTS idx_access_log_timestamp ON public.access_log(timestamp DESC);
