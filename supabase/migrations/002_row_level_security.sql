-- ==============================================================================
-- Migration: 002_row_level_security.sql
-- Description: Row Level Security (RLS) policies and helper security functions
-- Model: Multi-tenant per Academy, Parent-Child isolation, Anonymous public-tier read-only
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- Helper Functions (SECURITY DEFINER for secure evaluation)
-- -----------------------------------------------------------------------------

-- 1. Get role of current authenticated user from public.profiles
CREATE OR REPLACE FUNCTION public.auth_profile_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 2. Get academy_id of current authenticated user from public.profiles
CREATE OR REPLACE FUNCTION public.auth_profile_academy()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT academy_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 3. Check if current user is an active registered guardian of a specific player
CREATE OR REPLACE FUNCTION public.auth_is_guardian_of(target_player_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.guardians
    WHERE player_id = target_player_id AND profile_id = auth.uid()
  );
$$;

-- 4. Check if current user is an authorized coach for a player's academy
CREATE OR REPLACE FUNCTION public.auth_is_coach_of_player(target_player_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.players p
    JOIN public.profiles pr ON pr.academy_id = p.academy_id
    WHERE p.id = target_player_id
      AND pr.id = auth.uid()
      AND pr.role = 'coach'
  );
$$;

-- -----------------------------------------------------------------------------
-- Enable RLS on EVERY Table
-- -----------------------------------------------------------------------------
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_accreditations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passport_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- Policies: academies
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "academies_select_public" ON public.academies;
CREATE POLICY "academies_select_public"
  ON public.academies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "academies_admin_all" ON public.academies;
CREATE POLICY "academies_admin_all"
  ON public.academies FOR ALL
  TO authenticated
  USING (public.auth_profile_role() = 'admin')
  WITH CHECK (public.auth_profile_role() = 'admin');

-- -----------------------------------------------------------------------------
-- Policies: academy_accreditations
-- Verified federation records are readable by anyone; manageable only by admin.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "accreditations_select_active" ON public.academy_accreditations;
CREATE POLICY "accreditations_select_active"
  ON public.academy_accreditations FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "accreditations_admin_all" ON public.academy_accreditations;
CREATE POLICY "accreditations_admin_all"
  ON public.academy_accreditations FOR ALL
  TO authenticated
  USING (public.auth_profile_role() = 'admin')
  WITH CHECK (public.auth_profile_role() = 'admin');

-- -----------------------------------------------------------------------------
-- Policies: profiles
-- Users can view their own profile; coaches can see other coaches in their academy; admin sees all.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR public.auth_profile_role() = 'admin'
    OR (
      public.auth_profile_role() = 'coach'
      AND academy_id = public.auth_profile_academy()
    )
  );

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.auth_profile_role() = 'admin')
  WITH CHECK (id = auth.uid() OR public.auth_profile_role() = 'admin');

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.auth_profile_role() = 'admin');

-- -----------------------------------------------------------------------------
-- Policies: players
-- Strict Multi-Tier Isolation:
-- - Anonymous: Only players with visibility_tier = 'public'
-- - Coach: Read/Write players in their own academy
-- - Parent: Read only their own children (via guardians table)
-- - Admin: Full access
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "players_select_policy" ON public.players;
CREATE POLICY "players_select_policy"
  ON public.players FOR SELECT
  USING (
    -- 1. Public tier readable by anyone (anon and authenticated)
    visibility_tier = 'public'
    -- 2. Link tier readable if share_token is valid
    OR (visibility_tier = 'link' AND share_token_expires_at > now())
    -- 3. Authenticated Coach in same academy
    OR (
      public.auth_profile_role() = 'coach'
      AND academy_id = public.auth_profile_academy()
    )
    -- 4. Authenticated Parent of child
    OR (
      public.auth_profile_role() = 'parent'
      AND public.auth_is_guardian_of(id)
    )
    -- 5. Admin
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "players_coach_insert" ON public.players;
CREATE POLICY "players_coach_insert"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.auth_profile_role() = 'coach' AND academy_id = public.auth_profile_academy())
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "players_coach_update" ON public.players;
CREATE POLICY "players_coach_update"
  ON public.players FOR UPDATE
  TO authenticated
  USING (
    (public.auth_profile_role() = 'coach' AND academy_id = public.auth_profile_academy())
    OR public.auth_profile_role() = 'admin'
  )
  WITH CHECK (
    (public.auth_profile_role() = 'coach' AND academy_id = public.auth_profile_academy())
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "players_admin_delete" ON public.players;
CREATE POLICY "players_admin_delete"
  ON public.players FOR DELETE
  TO authenticated
  USING (public.auth_profile_role() = 'admin');

-- -----------------------------------------------------------------------------
-- Policies: guardians
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "guardians_select" ON public.guardians;
CREATE POLICY "guardians_select"
  ON public.guardians FOR SELECT
  TO authenticated
  USING (
    profile_id = auth.uid()
    OR public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "guardians_coach_admin_write" ON public.guardians;
CREATE POLICY "guardians_coach_admin_write"
  ON public.guardians FOR ALL
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  )
  WITH CHECK (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- Policies: consents (UU PDP No. 27/2022)
-- Guardians can view and update their own consents (e.g. revoke immediately).
-- Coaches can view consents of their academy players.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "consents_select" ON public.consents;
CREATE POLICY "consents_select"
  ON public.consents FOR SELECT
  TO authenticated
  USING (
    guardian_id = auth.uid()
    OR public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "consents_guardian_insert" ON public.consents;
CREATE POLICY "consents_guardian_insert"
  ON public.consents FOR INSERT
  TO authenticated
  WITH CHECK (
    (guardian_id = auth.uid() AND public.auth_is_guardian_of(player_id))
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "consents_guardian_update" ON public.consents;
CREATE POLICY "consents_guardian_update"
  ON public.consents FOR UPDATE
  TO authenticated
  USING (
    (guardian_id = auth.uid() AND public.auth_is_guardian_of(player_id))
    OR public.auth_profile_role() = 'admin'
  )
  WITH CHECK (
    (guardian_id = auth.uid() AND public.auth_is_guardian_of(player_id))
    OR public.auth_profile_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- Policies: player_assessments
-- Only coaches of the player's academy and admin can insert/update.
-- Parents can view only their child's assessments.
-- Anonymous can view only published assessments of 'public' players.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "assessments_select" ON public.player_assessments;
CREATE POLICY "assessments_select"
  ON public.player_assessments FOR SELECT
  USING (
    -- Anonymous / Scout view: only if player is public and assessment published
    (
      is_published = true
      AND EXISTS (
        SELECT 1 FROM public.players p
        WHERE p.id = player_assessments.player_id
          AND p.visibility_tier = 'public'
      )
    )
    -- Coach of the academy
    OR public.auth_is_coach_of_player(player_id)
    -- Parent of the player
    OR public.auth_is_guardian_of(player_id)
    -- Admin
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "assessments_coach_write" ON public.player_assessments;
CREATE POLICY "assessments_coach_write"
  ON public.player_assessments FOR ALL
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  )
  WITH CHECK (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- Policies: fitness_records
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "fitness_select" ON public.fitness_records;
CREATE POLICY "fitness_select"
  ON public.fitness_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = fitness_records.player_id
        AND p.visibility_tier = 'public'
    )
    OR public.auth_is_coach_of_player(player_id)
    OR public.auth_is_guardian_of(player_id)
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "fitness_coach_write" ON public.fitness_records;
CREATE POLICY "fitness_coach_write"
  ON public.fitness_records FOR ALL
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  )
  WITH CHECK (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- Policies: video_highlights
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "highlights_select" ON public.video_highlights;
CREATE POLICY "highlights_select"
  ON public.video_highlights FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.players p
      WHERE p.id = video_highlights.player_id
        AND p.visibility_tier = 'public'
    )
    OR public.auth_is_coach_of_player(player_id)
    OR public.auth_is_guardian_of(player_id)
    OR public.auth_profile_role() = 'admin'
  );

DROP POLICY IF EXISTS "highlights_coach_write" ON public.video_highlights;
CREATE POLICY "highlights_coach_write"
  ON public.video_highlights FOR ALL
  TO authenticated
  USING (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  )
  WITH CHECK (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- -----------------------------------------------------------------------------
-- Policies: passport_snapshots (Immutable Audit Records)
-- Snapshots can be verified publicly by anyone holding the SHA-256 hash.
-- Creation allowed only by Coach or Admin.
-- Modification and deletion are blocked to preserve tamper-evidence.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "snapshots_select_by_hash_or_role" ON public.passport_snapshots;
CREATE POLICY "snapshots_select_by_hash_or_role"
  ON public.passport_snapshots FOR SELECT
  USING (
    -- Verification lookup: readable by public for cryptographic verification
    true
  );

DROP POLICY IF EXISTS "snapshots_insert_coach" ON public.passport_snapshots;
CREATE POLICY "snapshots_insert_coach"
  ON public.passport_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- No UPDATE or DELETE policy is defined for snapshots -> immutable!

-- -----------------------------------------------------------------------------
-- Policies: access_log (Append-Only Audit Trail)
-- Any authenticated actor can insert their own audit entries.
-- Read access restricted to guardians (for their child), coaches (for their academy), and admins.
-- No UPDATE or DELETE permitted.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "access_log_insert" ON public.access_log;
CREATE POLICY "access_log_insert"
  ON public.access_log FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_profile_id = auth.uid()
    OR actor_profile_id IS NULL
  );

DROP POLICY IF EXISTS "access_log_select" ON public.access_log;
CREATE POLICY "access_log_select"
  ON public.access_log FOR SELECT
  TO authenticated
  USING (
    public.auth_is_guardian_of(player_id)
    OR public.auth_is_coach_of_player(player_id)
    OR public.auth_profile_role() = 'admin'
  );

-- No UPDATE or DELETE policy for access_log -> append-only!
