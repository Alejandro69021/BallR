-- ==============================================================================
-- Migration: 008_report_snapshots.sql
-- Description: Immutable, reviewed snapshots of match reports (canonical payload + SHA-256).
-- Rules:
--   * Only FINAL matches can be snapshotted.
--   * Each snapshot needs a reviewer (coach/admin of the same academy); the reviewer must
--     differ from the creator when the academy has more than one staff member.
--   * Snapshots can never be updated or deleted. Staff of the academy only; no anon, no parents.
--   * events_digest ties the report to the exact event list at the time (final matches are
--     locked by migration 007, so the digest can be re-computed later to detect divergence).
-- Requires: 001, 002, 005, 006, 007.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.report_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE RESTRICT,
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE RESTRICT,
    payload_version TEXT NOT NULL,
    snapshot_hash TEXT NOT NULL CHECK (snapshot_hash ~ '^[0-9a-f]{64}$'),
    events_digest TEXT NOT NULL CHECK (events_digest ~ '^[0-9a-f]{64}$'),
    canonical_payload JSONB NOT NULL CHECK (jsonb_typeof(canonical_payload) = 'object'),
    reviewed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (match_id, snapshot_hash)
);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_match ON public.report_snapshots(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_hash ON public.report_snapshots(snapshot_hash);

CREATE OR REPLACE FUNCTION public.validate_report_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  reviewer RECORD;
  staff_count INTEGER;
BEGIN
  SELECT academy_id, status INTO m FROM public.matches WHERE id = NEW.match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pertandingan tidak ditemukan'; END IF;
  IF m.status <> 'final' THEN
    RAISE EXCEPTION 'Laporan hanya dapat dibekukan untuk pertandingan yang sudah final';
  END IF;
  IF NEW.academy_id IS DISTINCT FROM m.academy_id THEN
    RAISE EXCEPTION 'Akademi laporan tidak sama dengan akademi pertandingan';
  END IF;
  IF COALESCE(NEW.canonical_payload ->> 'match_id', '') <> NEW.match_id::text THEN
    RAISE EXCEPTION 'match_id pada payload tidak sama dengan pertandingan';
  END IF;

  SELECT role, academy_id INTO reviewer FROM public.profiles WHERE id = NEW.reviewed_by;
  IF NOT FOUND OR reviewer.role NOT IN ('coach', 'admin')
     OR (reviewer.role = 'coach' AND reviewer.academy_id IS DISTINCT FROM NEW.academy_id) THEN
    RAISE EXCEPTION 'Peninjau harus pelatih akademi yang sama atau admin';
  END IF;

  SELECT count(*) INTO staff_count FROM public.profiles
    WHERE (academy_id = NEW.academy_id AND role = 'coach') OR role = 'admin';
  IF NEW.reviewed_by = NEW.created_by AND staff_count > 1 THEN
    RAISE EXCEPTION 'Peninjau harus berbeda dari pembuat laporan (staf lebih dari satu)';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_report_snapshots_validate ON public.report_snapshots;
CREATE TRIGGER trg_report_snapshots_validate BEFORE INSERT ON public.report_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.validate_report_snapshot();

CREATE OR REPLACE FUNCTION public.block_report_snapshot_changes()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Snapshot laporan bersifat tetap dan tidak dapat diubah atau dihapus';
END; $$;
DROP TRIGGER IF EXISTS trg_report_snapshots_immutable ON public.report_snapshots;
CREATE TRIGGER trg_report_snapshots_immutable BEFORE UPDATE OR DELETE ON public.report_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.block_report_snapshot_changes();

ALTER TABLE public.report_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_snapshots FROM anon, authenticated;
GRANT SELECT, INSERT ON public.report_snapshots TO authenticated;

DROP POLICY IF EXISTS report_snapshots_staff_select ON public.report_snapshots;
CREATE POLICY report_snapshots_staff_select ON public.report_snapshots FOR SELECT TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id));
DROP POLICY IF EXISTS report_snapshots_staff_insert ON public.report_snapshots;
CREATE POLICY report_snapshots_staff_insert ON public.report_snapshots FOR INSERT TO authenticated
  WITH CHECK (public.auth_is_staff_of_academy(academy_id) AND created_by = auth.uid());
