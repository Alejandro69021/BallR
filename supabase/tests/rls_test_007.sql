-- Test suite for migration 007. Runs in one transaction and rolls back.
BEGIN;

CREATE OR REPLACE FUNCTION pg_temp.t(uid uuid, r text, q text, expect_ok boolean, label text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE ok boolean := true; err text := '';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(uid::text, ''), true);
  EXECUTE 'SET LOCAL ROLE ' || r;
  BEGIN
    EXECUTE q;
  EXCEPTION WHEN OTHERS THEN ok := false; err := SQLERRM;
  END;
  RESET ROLE;
  IF ok = expect_ok THEN
    RAISE NOTICE 'PASS  %', label;
  ELSE
    RAISE EXCEPTION 'FAIL  % (expected %, got %, err=%)', label, expect_ok, ok, err;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION pg_temp.count_as(uid uuid, r text, q text) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(uid::text, ''), true);
  EXECUTE 'SET LOCAL ROLE ' || r;
  EXECUTE q INTO n;
  RESET ROLE;
  RETURN n;
END $$;

-- Fixtures (as superuser)
INSERT INTO auth.users(id) VALUES
 ('aaaaaaaa-0000-4000-8000-00000000000a'),('aaaaaaaa-0000-4000-8000-00000000000b'),
 ('aaaaaaaa-0000-4000-8000-00000000000c'),('aaaaaaaa-0000-4000-8000-00000000000d'),
 ('aaaaaaaa-0000-4000-8000-00000000000e');
INSERT INTO public.academies(id,name) VALUES
 ('11111111-0000-4000-8000-000000000001','Akademi A'),('11111111-0000-4000-8000-000000000002','Akademi B');
INSERT INTO public.profiles(id,role,academy_id,full_name) VALUES
 ('aaaaaaaa-0000-4000-8000-00000000000a','coach','11111111-0000-4000-8000-000000000001','Coach A1'),
 ('aaaaaaaa-0000-4000-8000-00000000000b','coach','11111111-0000-4000-8000-000000000001','Coach A2'),
 ('aaaaaaaa-0000-4000-8000-00000000000c','coach','11111111-0000-4000-8000-000000000002','Coach B1'),
 ('aaaaaaaa-0000-4000-8000-00000000000d','parent',NULL,'Parent'),
 ('aaaaaaaa-0000-4000-8000-00000000000e','admin',NULL,'Admin');
INSERT INTO public.players(id,public_id,academy_id,full_name,nickname) VALUES
 ('bbbbbbbb-0000-4000-8000-000000000001','P-A','11111111-0000-4000-8000-000000000001','Pemain A','A'),
 ('bbbbbbbb-0000-4000-8000-000000000002','P-B','11111111-0000-4000-8000-000000000002','Pemain B','B');

-- ===== matches =====
SELECT pg_temp.t(NULL,'anon','SELECT count(*) FROM public.matches',false,'anon cannot read matches');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.matches(id,academy_id,opponent_name,match_date) VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','Lawan 1','2026-11-01')$$,true,'coach A creates match in own academy');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.matches(academy_id,opponent_name,match_date) VALUES ('11111111-0000-4000-8000-000000000002','X','2026-11-01')$$,false,'coach A cannot create match in academy B');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.matches(academy_id,opponent_name,match_date,created_by) VALUES ('11111111-0000-4000-8000-000000000001','X','2026-11-01','aaaaaaaa-0000-4000-8000-00000000000b')$$,false,'cannot spoof created_by');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.matches(academy_id,opponent_name,match_date,pitch_length_m) VALUES ('11111111-0000-4000-8000-000000000001','X','2026-11-01',500)$$,false,'pitch length bounds enforced');
DO $$ BEGIN
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000c','authenticated','SELECT count(*) FROM public.matches') <> 0 THEN RAISE EXCEPTION 'FAIL coach B sees academy A matches'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000d','authenticated','SELECT count(*) FROM public.matches') <> 0 THEN RAISE EXCEPTION 'FAIL parent sees matches'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000a','authenticated','SELECT count(*) FROM public.matches') <> 1 THEN RAISE EXCEPTION 'FAIL coach A should see 1 match'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000e','authenticated','SELECT count(*) FROM public.matches') <> 1 THEN RAISE EXCEPTION 'FAIL admin should see 1 match'; END IF;
  RAISE NOTICE 'PASS  isolation: coach B 0, parent 0, coach A 1, admin 1';
END $$;

-- ===== participants and events =====
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_participants(match_id,player_id,started) VALUES ('cccccccc-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000001',true)$$,true,'participant from same academy');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_participants(match_id,player_id) VALUES ('cccccccc-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002')$$,false,'participant from other academy rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,player_id,minute,event_type,outcome,x_m,y_m,end_x_m,end_y_m) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001','own','bbbbbbbb-0000-4000-8000-000000000001',12.5,'pass','success',30,20,55,30)$$,true,'valid event');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,minute,event_type,x_m,y_m) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000002','own',5,'shot',95,20)$$,false,'x beyond pitch length (90) rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,minute,event_type,x_m) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000003','own',5,'shot',10)$$,false,'x without y rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,player_id,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000004','own','bbbbbbbb-0000-4000-8000-000000000002',5,'pass')$$,false,'event with player of other academy rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,player_id,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000005','opponent','bbbbbbbb-0000-4000-8000-000000000001',5,'pass')$$,false,'opponent event cannot reference our player');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,opponent_number,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000006','opponent',9,40,'shot')$$,true,'opponent event by jersey number');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001','own',13,'pass')$$,false,'duplicate client_event_id rejected (plain insert)');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000001','own',13,'pass') ON CONFLICT (match_id,client_event_id) DO NOTHING$$,true,'retry with ON CONFLICT DO NOTHING is idempotent');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000c','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000007','own',1,'pass')$$,false,'coach B cannot write events of academy A match');

-- ===== final match immutability =====
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.matches SET status='final', own_score=2, opponent_score=1 WHERE id='cccccccc-0000-4000-8000-000000000001'$$,true,'coach finalises match');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.match_events(match_id,client_event_id,team,minute,event_type) VALUES ('cccccccc-0000-4000-8000-000000000001','dddddddd-0000-4000-8000-000000000008','own',60,'pass')$$,false,'no new events on final match');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$DELETE FROM public.match_events WHERE match_id='cccccccc-0000-4000-8000-000000000001'$$,false,'no event delete on final match');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.matches SET status='draft' WHERE id='cccccccc-0000-4000-8000-000000000001'$$,false,'coach cannot reopen final match');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000e','authenticated',
 $$UPDATE public.matches SET status='draft' WHERE id='cccccccc-0000-4000-8000-000000000001'$$,true,'admin can reopen final match');

-- ===== scenarios =====
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.tactical_scenarios(id,academy_id,title,phase) VALUES ('eeeeeeee-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','Build-up 3-2-4-1','build_up')$$,true,'coach creates draft scenario');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='published' WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'cannot publish without review');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='published', reviewed_by='aaaaaaaa-0000-4000-8000-00000000000b', reviewed_at=now() WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'cannot publish without reference');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.scenario_references(scenario_id,reference_id,note) VALUES ('eeeeeeee-0000-4000-8000-000000000001','fifa-tcp-scales-of-the-game','Skala permainan')$$,true,'attach a reference');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='published', reviewed_by='aaaaaaaa-0000-4000-8000-00000000000b', reviewed_at=now() WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'cannot publish without frames');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.scenario_frames(scenario_id,frame_idx,t_ms,players) VALUES ('eeeeeeee-0000-4000-8000-000000000001',0,0,'[{"id":"own-6","team":"own","x":40,"y":30}]')$$,true,'add frame');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='published', reviewed_by='aaaaaaaa-0000-4000-8000-00000000000a', reviewed_at=now() WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'self-review rejected when academy has 2+ staff');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='published', reviewed_by='aaaaaaaa-0000-4000-8000-00000000000c', reviewed_at=now() WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'reviewer from another academy rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='published', reviewed_by='aaaaaaaa-0000-4000-8000-00000000000b', reviewed_at=now() WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,true,'publish with peer reviewer + reference + frame');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET title='Diubah' WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'published scenario content is frozen');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.scenario_frames(scenario_id,frame_idx,players) VALUES ('eeeeeeee-0000-4000-8000-000000000001',1,'[]')$$,false,'frames frozen after publish');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$DELETE FROM public.scenario_references WHERE scenario_id='eeeeeeee-0000-4000-8000-000000000001'$$,false,'references frozen after publish');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.tactical_scenarios SET status='draft' WHERE id='eeeeeeee-0000-4000-8000-000000000001'$$,true,'back to draft allowed');
DO $$ BEGIN
  IF (SELECT reviewed_by FROM public.tactical_scenarios WHERE id='eeeeeeee-0000-4000-8000-000000000001') IS NOT NULL THEN RAISE EXCEPTION 'FAIL review not cleared on draft'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000c','authenticated','SELECT count(*) FROM public.tactical_scenarios') <> 0 THEN RAISE EXCEPTION 'FAIL coach B sees scenarios'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000d','authenticated','SELECT count(*) FROM public.scenario_frames') <> 0 THEN RAISE EXCEPTION 'FAIL parent sees frames'; END IF;
  RAISE NOTICE 'PASS  review cleared on draft; other academy and parent see nothing';
END $$;
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.scenario_frames(scenario_id,frame_idx,players) VALUES ('eeeeeeee-0000-4000-8000-000000000001',9,'{"not":"array"}')$$,false,'frame players must be a JSON array');
SELECT pg_temp.t(NULL,'anon','SELECT count(*) FROM public.tactical_scenarios',false,'anon cannot read scenarios');

SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000e','authenticated',
 $$UPDATE public.matches SET created_by='aaaaaaaa-0000-4000-8000-00000000000e' WHERE id='cccccccc-0000-4000-8000-000000000001'$$,true,'update runs (created_by silently kept)');
DO $$ BEGIN
  IF (SELECT created_by FROM public.matches WHERE id='cccccccc-0000-4000-8000-000000000001') <> 'aaaaaaaa-0000-4000-8000-00000000000a' THEN RAISE EXCEPTION 'FAIL created_by was changed'; END IF;
  RAISE NOTICE 'PASS  created_by is immutable';
END $$;
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.matches SET status='final' WHERE id='cccccccc-0000-4000-8000-000000000001'$$,true,'finalise again');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$DELETE FROM public.matches WHERE id='cccccccc-0000-4000-8000-000000000001'$$,true,'delete of a FINAL match is silently filtered by RLS (0 rows)');
DO $$ BEGIN
  IF (SELECT count(*) FROM public.matches WHERE id='cccccccc-0000-4000-8000-000000000001') <> 1 THEN RAISE EXCEPTION 'FAIL final match was deleted'; END IF;
  RAISE NOTICE 'PASS  final match survives delete attempt';
END $$;

ROLLBACK;
