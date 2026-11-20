-- ==============================================================================
-- Migration: 007_matches_and_tactics.sql
-- Description: Match records, logged match events (coordinates in metres), and
--              coach-authored tactical scenarios with a publish guard.
-- Principles:
--   * Private by default: only coaches of the same academy and admins can read or write.
--     No anon access. No parent access in this migration (child data stays minimal).
--   * Opponent players are recorded by jersey number only (no names of other children).
--   * Events are idempotent (client_event_id) so offline sync can retry safely.
--   * A scenario cannot be published without a reviewer and at least one reference.
-- Requires: 001, 002, 005, 006.
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. Matches
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    opponent_name TEXT NOT NULL,
    match_date DATE NOT NULL,
    competition TEXT NOT NULL DEFAULT '',
    age_group TEXT NOT NULL DEFAULT 'U-13',
    format TEXT NOT NULL DEFAULT '11v11' CHECK (format IN ('5v5', '7v7', '9v9', '11v11')),
    pitch_length_m NUMERIC(5,1) NOT NULL DEFAULT 90 CHECK (pitch_length_m BETWEEN 20 AND 120),
    pitch_width_m  NUMERIC(5,1) NOT NULL DEFAULT 60 CHECK (pitch_width_m BETWEEN 15 AND 90),
    own_score SMALLINT CHECK (own_score >= 0),
    opponent_score SMALLINT CHECK (opponent_score >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
    created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_matches_academy_date ON public.matches(academy_id, match_date DESC);

-- -----------------------------------------------------------------------------
-- 2. Participants (which of our players took part)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_participants (
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    started BOOLEAN NOT NULL DEFAULT false,
    position TEXT NOT NULL DEFAULT '',
    minute_in SMALLINT CHECK (minute_in BETWEEN 0 AND 130),
    minute_out SMALLINT CHECK (minute_out BETWEEN 0 AND 130),
    PRIMARY KEY (match_id, player_id),
    CHECK (minute_out IS NULL OR minute_in IS NULL OR minute_out >= minute_in)
);

-- -----------------------------------------------------------------------------
-- 3. Match events. Coordinates are metres on the pitch of THIS match:
--    x runs 0..pitch_length_m from our own goal line towards the opponent goal,
--    y runs 0..pitch_width_m from the left touchline to the right (our attacking direction).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    client_event_id UUID NOT NULL,
    team TEXT NOT NULL CHECK (team IN ('own', 'opponent')),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    opponent_number SMALLINT CHECK (opponent_number BETWEEN 1 AND 99),
    period SMALLINT NOT NULL DEFAULT 1 CHECK (period BETWEEN 1 AND 4),
    minute NUMERIC(5,2) NOT NULL CHECK (minute >= 0 AND minute <= 130),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'pass', 'key_pass', 'shot', 'shot_on_target', 'goal',
        'dribble', 'tackle', 'interception', 'clearance',
        'duel_ground', 'duel_air', 'ball_recovery', 'ball_loss',
        'foul_committed', 'foul_won', 'save',
        'corner', 'free_kick', 'throw_in', 'goal_kick', 'offside', 'note')),
    outcome TEXT CHECK (outcome IN ('success', 'fail')),
    x_m NUMERIC(5,1) CHECK (x_m >= 0),
    y_m NUMERIC(5,1) CHECK (y_m >= 0),
    end_x_m NUMERIC(5,1) CHECK (end_x_m >= 0),
    end_y_m NUMERIC(5,1) CHECK (end_y_m >= 0),
    note TEXT NOT NULL DEFAULT '',
    created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (match_id, client_event_id),
    CHECK (team = 'own' OR player_id IS NULL),
    CHECK (team = 'opponent' OR opponent_number IS NULL),
    CHECK ((x_m IS NULL) = (y_m IS NULL)),
    CHECK ((end_x_m IS NULL) = (end_y_m IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_match_events_match_minute ON public.match_events(match_id, period, minute);

-- -----------------------------------------------------------------------------
-- 4. Tactical scenarios (coach-authored) with frames and references
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tactical_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
    match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN (
        'build_up', 'progression', 'final_third', 'mid_block', 'high_press',
        'transition_attack', 'transition_defence', 'set_piece')),
    format TEXT NOT NULL DEFAULT '11v11' CHECK (format IN ('5v5', '7v7', '9v9', '11v11')),
    formation_own TEXT NOT NULL DEFAULT '',
    formation_opponent TEXT NOT NULL DEFAULT '',
    pitch_length_m NUMERIC(5,1) NOT NULL DEFAULT 90 CHECK (pitch_length_m BETWEEN 20 AND 120),
    pitch_width_m  NUMERIC(5,1) NOT NULL DEFAULT 60 CHECK (pitch_width_m BETWEEN 15 AND 90),
    description TEXT NOT NULL DEFAULT '',
    coaching_points TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published')),
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scenarios_academy ON public.tactical_scenarios(academy_id, status);

CREATE TABLE IF NOT EXISTS public.scenario_frames (
    scenario_id UUID NOT NULL REFERENCES public.tactical_scenarios(id) ON DELETE CASCADE,
    frame_idx INTEGER NOT NULL CHECK (frame_idx >= 0),
    t_ms INTEGER NOT NULL DEFAULT 0 CHECK (t_ms >= 0),
    -- [{ "id": "own-6", "team": "own|opponent", "x": 42.5, "y": 30.0, "label": "6" }]
    players JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(players) = 'array' AND jsonb_array_length(players) <= 24),
    ball JSONB CHECK (ball IS NULL OR jsonb_typeof(ball) = 'object'),
    -- [{ "from": {"x":..,"y":..}, "to": {"x":..,"y":..}, "kind": "pass|run|press|cover" }]
    arrows JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(arrows) = 'array' AND jsonb_array_length(arrows) <= 40),
    note TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (scenario_id, frame_idx)
);

CREATE TABLE IF NOT EXISTS public.scenario_references (
    scenario_id UUID NOT NULL REFERENCES public.tactical_scenarios(id) ON DELETE CASCADE,
    reference_id TEXT NOT NULL REFERENCES public.references(id) ON DELETE RESTRICT,
    note TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (scenario_id, reference_id)
);

-- -----------------------------------------------------------------------------
-- 5. Integrity triggers
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_matches_touch ON public.matches;
CREATE TRIGGER trg_matches_touch BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_scenarios_touch ON public.tactical_scenarios;
CREATE TRIGGER trg_scenarios_touch BEFORE UPDATE ON public.tactical_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Participants and events: our players must belong to the match's academy.
CREATE OR REPLACE FUNCTION public.validate_match_child_row()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  m RECORD;
  p_academy UUID;
BEGIN
  SELECT academy_id, pitch_length_m, pitch_width_m, status INTO m FROM public.matches WHERE id = NEW.match_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pertandingan tidak ditemukan'; END IF;

  IF NEW.player_id IS NOT NULL THEN
    SELECT academy_id INTO p_academy FROM public.players WHERE id = NEW.player_id;
    IF p_academy IS DISTINCT FROM m.academy_id THEN
      RAISE EXCEPTION 'Pemain bukan bagian dari akademi pertandingan ini';
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'match_events' THEN
    IF m.status = 'final' THEN
      RAISE EXCEPTION 'Pertandingan sudah final; buka kembali sebagai draf untuk mengubah kejadian';
    END IF;
    IF NEW.x_m IS NOT NULL AND (NEW.x_m > m.pitch_length_m OR NEW.y_m > m.pitch_width_m) THEN
      RAISE EXCEPTION 'Koordinat di luar lapangan (% x % m)', m.pitch_length_m, m.pitch_width_m;
    END IF;
    IF NEW.end_x_m IS NOT NULL AND (NEW.end_x_m > m.pitch_length_m OR NEW.end_y_m > m.pitch_width_m) THEN
      RAISE EXCEPTION 'Koordinat akhir di luar lapangan (% x % m)', m.pitch_length_m, m.pitch_width_m;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_participants_validate ON public.match_participants;
CREATE TRIGGER trg_participants_validate BEFORE INSERT OR UPDATE ON public.match_participants
  FOR EACH ROW EXECUTE FUNCTION public.validate_match_child_row();
DROP TRIGGER IF EXISTS trg_events_validate ON public.match_events;
CREATE TRIGGER trg_events_validate BEFORE INSERT OR UPDATE ON public.match_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_match_child_row();

-- Final matches: events cannot be deleted either (reopen the match first).
CREATE OR REPLACE FUNCTION public.block_event_delete_when_final()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s TEXT;
BEGIN
  SELECT status INTO s FROM public.matches WHERE id = OLD.match_id;
  IF s = 'final' THEN
    RAISE EXCEPTION 'Pertandingan sudah final; buka kembali sebagai draf untuk menghapus kejadian';
  END IF;
  RETURN OLD;
END; $$;
DROP TRIGGER IF EXISTS trg_events_no_delete_final ON public.match_events;
CREATE TRIGGER trg_events_no_delete_final BEFORE DELETE ON public.match_events
  FOR EACH ROW EXECUTE FUNCTION public.block_event_delete_when_final();

-- Only admins can reopen a final match.
CREATE OR REPLACE FUNCTION public.guard_match_reopen()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'final' AND NEW.status <> 'final'
     AND public.auth_profile_role() IS DISTINCT FROM 'admin' AND auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'Hanya admin yang dapat membuka kembali pertandingan final';
  END IF;
  IF OLD.status = 'final' AND NEW.status = 'final'
     AND (NEW.pitch_length_m <> OLD.pitch_length_m OR NEW.pitch_width_m <> OLD.pitch_width_m) THEN
    RAISE EXCEPTION 'Ukuran lapangan tidak dapat diubah pada pertandingan final';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_matches_guard ON public.matches;
CREATE TRIGGER trg_matches_guard BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.guard_match_reopen();

-- Publish guard for scenarios.
CREATE OR REPLACE FUNCTION public.guard_scenario_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ref_count INTEGER;
  reviewer RECORD;
  staff_count INTEGER;
BEGIN
  IF NEW.status IN ('reviewed', 'published') THEN
    IF NEW.reviewed_by IS NULL OR NEW.reviewed_at IS NULL THEN
      RAISE EXCEPTION 'Skema harus ditinjau pelatih (reviewed_by dan reviewed_at wajib diisi)';
    END IF;
    SELECT role, academy_id INTO reviewer FROM public.profiles WHERE id = NEW.reviewed_by;
    IF reviewer.role NOT IN ('coach', 'admin') OR reviewer.academy_id IS DISTINCT FROM NEW.academy_id THEN
      RAISE EXCEPTION 'Peninjau harus pelatih atau admin dari akademi yang sama';
    END IF;
    SELECT count(*) INTO staff_count FROM public.profiles
      WHERE academy_id = NEW.academy_id AND role IN ('coach', 'admin');
    IF NEW.reviewed_by = NEW.created_by AND staff_count > 1 THEN
      RAISE EXCEPTION 'Peninjau harus berbeda dari pembuat skema (akademi memiliki lebih dari satu staf)';
    END IF;
  END IF;

  IF NEW.status = 'published' THEN
    SELECT count(*) INTO ref_count FROM public.scenario_references WHERE scenario_id = NEW.id;
    IF ref_count = 0 THEN
      RAISE EXCEPTION 'Skema tidak dapat diterbitkan tanpa minimal satu rujukan';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.scenario_frames WHERE scenario_id = NEW.id) THEN
      RAISE EXCEPTION 'Skema tidak dapat diterbitkan tanpa bingkai (frame)';
    END IF;
  END IF;

  -- A published scenario's content is frozen; going back to draft is allowed (and clears the review).
  IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status = 'published'
     AND (NEW.title, NEW.phase, NEW.description, NEW.coaching_points, NEW.formation_own, NEW.formation_opponent,
          NEW.pitch_length_m, NEW.pitch_width_m)
         IS DISTINCT FROM
         (OLD.title, OLD.phase, OLD.description, OLD.coaching_points, OLD.formation_own, OLD.formation_opponent,
          OLD.pitch_length_m, OLD.pitch_width_m) THEN
    RAISE EXCEPTION 'Skema yang sudah diterbitkan tidak dapat diubah; kembalikan ke draf terlebih dahulu';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> 'draft' AND NEW.status = 'draft' THEN
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_scenarios_guard ON public.tactical_scenarios;
CREATE TRIGGER trg_scenarios_guard BEFORE INSERT OR UPDATE ON public.tactical_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.guard_scenario_status();

-- Frames and references of a published scenario are frozen.
CREATE OR REPLACE FUNCTION public.block_changes_on_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid UUID; s TEXT;
BEGIN
  sid := COALESCE(NEW.scenario_id, OLD.scenario_id);
  SELECT status INTO s FROM public.tactical_scenarios WHERE id = sid;
  IF s = 'published' THEN
    RAISE EXCEPTION 'Skema sudah diterbitkan; kembalikan ke draf untuk mengubah bingkai atau rujukan';
  END IF;
  RETURN COALESCE(NEW, OLD);
END; $$;
DROP TRIGGER IF EXISTS trg_frames_frozen ON public.scenario_frames;
CREATE TRIGGER trg_frames_frozen BEFORE INSERT OR UPDATE OR DELETE ON public.scenario_frames
  FOR EACH ROW EXECUTE FUNCTION public.block_changes_on_published();
DROP TRIGGER IF EXISTS trg_scenref_frozen ON public.scenario_references;
CREATE TRIGGER trg_scenref_frozen BEFORE INSERT OR UPDATE OR DELETE ON public.scenario_references
  FOR EACH ROW EXECUTE FUNCTION public.block_changes_on_published();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security: staff of the same academy (coach/admin) only. No anon, no parents.
-- -----------------------------------------------------------------------------
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tactical_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenario_references ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.matches, public.match_participants, public.match_events,
              public.tactical_scenarios, public.scenario_frames, public.scenario_references FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches, public.match_participants, public.match_events,
              public.tactical_scenarios, public.scenario_frames, public.scenario_references TO authenticated;

CREATE OR REPLACE FUNCTION public.auth_is_staff_of_academy(target_academy UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE(
    public.auth_profile_role() = 'admin'
    OR (public.auth_profile_role() = 'coach' AND public.auth_profile_academy() = target_academy),
    false);
$$;

CREATE OR REPLACE FUNCTION public.auth_is_staff_of_match(target_match UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT public.auth_is_staff_of_academy(academy_id) FROM public.matches WHERE id = target_match), false);
$$;

CREATE OR REPLACE FUNCTION public.auth_is_staff_of_scenario(target_scenario UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT COALESCE((SELECT public.auth_is_staff_of_academy(academy_id) FROM public.tactical_scenarios WHERE id = target_scenario), false);
$$;

-- created_by is fixed at insert time and can never be changed afterwards.
CREATE OR REPLACE FUNCTION public.lock_created_by()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.created_by := OLD.created_by; RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_matches_lock_creator ON public.matches;
CREATE TRIGGER trg_matches_lock_creator BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.lock_created_by();
DROP TRIGGER IF EXISTS trg_events_lock_creator ON public.match_events;
CREATE TRIGGER trg_events_lock_creator BEFORE UPDATE ON public.match_events
  FOR EACH ROW EXECUTE FUNCTION public.lock_created_by();
DROP TRIGGER IF EXISTS trg_scenarios_lock_creator ON public.tactical_scenarios;
CREATE TRIGGER trg_scenarios_lock_creator BEFORE UPDATE ON public.tactical_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.lock_created_by();

DROP POLICY IF EXISTS matches_staff_all ON public.matches;
DROP POLICY IF EXISTS matches_staff_select ON public.matches;
DROP POLICY IF EXISTS matches_staff_insert ON public.matches;
DROP POLICY IF EXISTS matches_staff_update ON public.matches;
DROP POLICY IF EXISTS matches_staff_delete ON public.matches;
CREATE POLICY matches_staff_select ON public.matches FOR SELECT TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id));
CREATE POLICY matches_staff_insert ON public.matches FOR INSERT TO authenticated
  WITH CHECK (public.auth_is_staff_of_academy(academy_id) AND created_by = auth.uid());
CREATE POLICY matches_staff_update ON public.matches FOR UPDATE TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id))
  WITH CHECK (public.auth_is_staff_of_academy(academy_id));
CREATE POLICY matches_staff_delete ON public.matches FOR DELETE TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id) AND status = 'draft');

DROP POLICY IF EXISTS participants_staff_all ON public.match_participants;
CREATE POLICY participants_staff_all ON public.match_participants FOR ALL TO authenticated
  USING (public.auth_is_staff_of_match(match_id))
  WITH CHECK (public.auth_is_staff_of_match(match_id));

DROP POLICY IF EXISTS events_staff_all ON public.match_events;
DROP POLICY IF EXISTS events_staff_select ON public.match_events;
DROP POLICY IF EXISTS events_staff_insert ON public.match_events;
DROP POLICY IF EXISTS events_staff_update ON public.match_events;
DROP POLICY IF EXISTS events_staff_delete ON public.match_events;
CREATE POLICY events_staff_select ON public.match_events FOR SELECT TO authenticated
  USING (public.auth_is_staff_of_match(match_id));
CREATE POLICY events_staff_insert ON public.match_events FOR INSERT TO authenticated
  WITH CHECK (public.auth_is_staff_of_match(match_id) AND created_by = auth.uid());
CREATE POLICY events_staff_update ON public.match_events FOR UPDATE TO authenticated
  USING (public.auth_is_staff_of_match(match_id))
  WITH CHECK (public.auth_is_staff_of_match(match_id));
CREATE POLICY events_staff_delete ON public.match_events FOR DELETE TO authenticated
  USING (public.auth_is_staff_of_match(match_id));

DROP POLICY IF EXISTS scenarios_staff_all ON public.tactical_scenarios;
DROP POLICY IF EXISTS scenarios_staff_select ON public.tactical_scenarios;
DROP POLICY IF EXISTS scenarios_staff_insert ON public.tactical_scenarios;
DROP POLICY IF EXISTS scenarios_staff_update ON public.tactical_scenarios;
DROP POLICY IF EXISTS scenarios_staff_delete ON public.tactical_scenarios;
CREATE POLICY scenarios_staff_select ON public.tactical_scenarios FOR SELECT TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id));
CREATE POLICY scenarios_staff_insert ON public.tactical_scenarios FOR INSERT TO authenticated
  WITH CHECK (public.auth_is_staff_of_academy(academy_id) AND created_by = auth.uid());
CREATE POLICY scenarios_staff_update ON public.tactical_scenarios FOR UPDATE TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id))
  WITH CHECK (public.auth_is_staff_of_academy(academy_id));
CREATE POLICY scenarios_staff_delete ON public.tactical_scenarios FOR DELETE TO authenticated
  USING (public.auth_is_staff_of_academy(academy_id) AND status = 'draft');

DROP POLICY IF EXISTS frames_staff_all ON public.scenario_frames;
CREATE POLICY frames_staff_all ON public.scenario_frames FOR ALL TO authenticated
  USING (public.auth_is_staff_of_scenario(scenario_id))
  WITH CHECK (public.auth_is_staff_of_scenario(scenario_id));

DROP POLICY IF EXISTS scenref_staff_all ON public.scenario_references;
CREATE POLICY scenref_staff_all ON public.scenario_references FOR ALL TO authenticated
  USING (public.auth_is_staff_of_scenario(scenario_id))
  WITH CHECK (public.auth_is_staff_of_scenario(scenario_id));
