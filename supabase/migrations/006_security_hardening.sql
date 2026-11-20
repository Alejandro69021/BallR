-- ==============================================================================
-- Migration: 006_security_hardening.sql
-- Fixes verified against 001/002/005 on PostgreSQL 16 (see SECURITY_REVIEW.md):
--   F1  Self-promotion to admin via profiles INSERT/UPDATE
--   F2  Anonymous read of full rows (full_name, birth_date, nisn, height, weight) for 'public' players
--   F3  'link' tier readable by everyone, token never checked
--   F4  passport_snapshots readable by everyone (all players, full payload)
--   F5  coach_raw_notes (and narrative derived from them) readable anonymously
--   F6  visibility can be set to public/link without parental consent; revoking consent did not unshare
-- Apply AFTER 001, 002, 005. Review in a test Supabase project first.
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- F1. profiles: no self-assigned roles
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;
CREATE POLICY "profiles_insert_admin_only"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.auth_profile_role() = 'admin');

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.auth_profile_role() = 'admin')
  WITH CHECK (id = auth.uid() OR public.auth_profile_role() = 'admin');

-- RLS cannot restrict columns, so block privileged-column changes with a trigger.
-- auth.uid() IS NULL means a backend context (SQL editor / service role), which is allowed.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND (NEW.role IS DISTINCT FROM OLD.role OR NEW.academy_id IS DISTINCT FROM OLD.academy_id)
     AND COALESCE(public.auth_profile_role(), '') <> 'admin' THEN
    RAISE EXCEPTION 'Hanya admin yang boleh mengubah peran atau akademi.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- -----------------------------------------------------------------------------
-- F2 + F3. players: direct table access only for signed-in, authorised users.
-- Anonymous visitors get minimal data through views / a token function.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "players_select_policy" ON public.players;
DROP POLICY IF EXISTS "players_select_authorized" ON public.players;
CREATE POLICY "players_select_authorized"
  ON public.players FOR SELECT
  TO authenticated
  USING (
    (public.auth_profile_role() = 'coach' AND academy_id = public.auth_profile_academy())
    OR (public.auth_profile_role() = 'parent' AND public.auth_is_guardian_of(id))
    OR public.auth_profile_role() = 'admin'
  );

-- Views run with the owner's rights (security_invoker = false), so they can read rows
-- that RLS hides from anon, but they only ever expose the listed columns.
CREATE OR REPLACE VIEW public.public_player_profiles
WITH (security_invoker = false) AS
  SELECT p.public_id, p.nickname, p.position, p.age_group, a.name AS academy_name, a.city AS academy_city
  FROM public.players p
  LEFT JOIN public.academies a ON a.id = p.academy_id
  WHERE p.visibility_tier = 'public';

CREATE OR REPLACE VIEW public.public_player_assessments
WITH (security_invoker = false) AS
  SELECT p.public_id, s.period_month, s.coach_name,
         s.pace, s.shooting, s.passing, s.dribbling, s.defending, s.physical,
         s.strengths, s.growth_areas
  FROM public.player_assessments s
  JOIN public.players p ON p.id = s.player_id
  WHERE p.visibility_tier = 'public' AND s.is_published = true;
-- Deliberately excluded: coach_raw_notes and ai_narrative (the template embeds raw notes).

CREATE OR REPLACE VIEW public.public_player_fitness
WITH (security_invoker = false) AS
  SELECT p.public_id, f.test_date, f.vertical_jump_cm, f.sprint_20m_sec, f.shuttle_run_sec, f.yoyo_score
  FROM public.fitness_records f
  JOIN public.players p ON p.id = f.player_id
  WHERE p.visibility_tier = 'public';

CREATE OR REPLACE VIEW public.public_player_highlights
WITH (security_invoker = false) AS
  SELECT p.public_id, h.title, h.match_opponent, h.match_minute, h.event_type, h.video_url, h.thumbnail_url
  FROM public.video_highlights h
  JOIN public.players p ON p.id = h.player_id
  WHERE p.visibility_tier = 'public';

GRANT SELECT ON public.public_player_profiles, public.public_player_assessments,
                public.public_player_fitness, public.public_player_highlights
  TO anon, authenticated;

-- Link tier: the caller must present the token.
CREATE OR REPLACE FUNCTION public.get_player_by_token(p_token TEXT)
RETURNS TABLE (public_id TEXT, nickname TEXT, player_position TEXT, age_group TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p.public_id, p.nickname, p.position, p.age_group
  FROM public.players p
  WHERE p.visibility_tier = 'link'
    AND p.share_token IS NOT NULL
    AND p.share_token = p_token
    AND p.share_token_expires_at > now();
$$;
REVOKE ALL ON FUNCTION public.get_player_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_player_by_token(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- F5. Related tables: anonymous branch removed (public data now flows through the views)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "assessments_select" ON public.player_assessments;
CREATE POLICY "assessments_select"
  ON public.player_assessments FOR SELECT
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_is_guardian_of(player_id)
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "fitness_select" ON public.fitness_records;
CREATE POLICY "fitness_select"
  ON public.fitness_records FOR SELECT
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_is_guardian_of(player_id)
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "highlights_select" ON public.video_highlights;
CREATE POLICY "highlights_select"
  ON public.video_highlights FOR SELECT
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_is_guardian_of(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- F4. passport_snapshots: no public enumeration; verification only by exact hash
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "snapshots_select_by_hash_or_role" ON public.passport_snapshots;
DROP POLICY IF EXISTS "snapshots_select_authorized" ON public.passport_snapshots;
CREATE POLICY "snapshots_select_authorized"
  ON public.passport_snapshots FOR SELECT
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_is_guardian_of(player_id)
    OR public.auth_profile_role() = 'admin'
  );

CREATE OR REPLACE FUNCTION public.verify_passport_snapshot(p_hash TEXT)
RETURNS TABLE (snapshot_hash TEXT, period_month TEXT, payload_version TEXT, canonical_payload JSONB, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT s.snapshot_hash, s.period_month, s.payload_version, s.canonical_payload, s.created_at
  FROM public.passport_snapshots s
  WHERE length(p_hash) = 64 AND s.snapshot_hash = lower(p_hash);
$$;
REVOKE ALL ON FUNCTION public.verify_passport_snapshot(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_passport_snapshot(TEXT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- F6. Visibility requires an active, matching parental consent (UU PDP No. 27/2022 Pasal 25)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_visibility_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  needed TEXT;
BEGIN
  IF NEW.visibility_tier IN ('public', 'link')
     AND (TG_OP = 'INSERT' OR NEW.visibility_tier IS DISTINCT FROM OLD.visibility_tier) THEN
    needed := CASE NEW.visibility_tier WHEN 'public' THEN 'public_profile' ELSE 'share_with_scouts' END;
    IF NOT EXISTS (
      SELECT 1 FROM public.consents c
      WHERE c.player_id = NEW.id
        AND c.revoked_at IS NULL
        AND COALESCE((c.purposes ->> needed)::boolean, false)
    ) THEN
      RAISE EXCEPTION 'Tidak ada persetujuan wali yang aktif untuk tingkat visibilitas "%".', NEW.visibility_tier;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_visibility_consent ON public.players;
CREATE TRIGGER trg_enforce_visibility_consent
  BEFORE INSERT OR UPDATE OF visibility_tier ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.enforce_visibility_consent();

-- Revoking consent, or switching a purpose off, immediately un-shares the player.
CREATE OR REPLACE FUNCTION public.unshare_on_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.revoked_at IS NOT NULL
     OR NOT COALESCE((NEW.purposes ->> 'public_profile')::boolean, false)
     OR NOT COALESCE((NEW.purposes ->> 'share_with_scouts')::boolean, false) THEN
    UPDATE public.players
       SET visibility_tier = 'private', share_token = NULL, share_token_expires_at = NULL
     WHERE id = NEW.player_id
       AND (
         (visibility_tier = 'public' AND (NEW.revoked_at IS NOT NULL OR NOT COALESCE((NEW.purposes ->> 'public_profile')::boolean, false)))
         OR
         (visibility_tier = 'link'   AND (NEW.revoked_at IS NOT NULL OR NOT COALESCE((NEW.purposes ->> 'share_with_scouts')::boolean, false)))
       );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_unshare_on_consent_change ON public.consents;
CREATE TRIGGER trg_unshare_on_consent_change
  AFTER UPDATE ON public.consents
  FOR EACH ROW EXECUTE FUNCTION public.unshare_on_consent_change();
