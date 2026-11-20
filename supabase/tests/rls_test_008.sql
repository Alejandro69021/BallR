BEGIN;
CREATE OR REPLACE FUNCTION pg_temp.t(uid uuid, r text, q text, expect_ok boolean, label text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE ok boolean := true; err text := '';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(uid::text, ''), true);
  EXECUTE 'SET LOCAL ROLE ' || r;
  BEGIN EXECUTE q; EXCEPTION WHEN OTHERS THEN ok := false; err := SQLERRM; END;
  RESET ROLE;
  IF ok = expect_ok THEN RAISE NOTICE 'PASS  %', label;
  ELSE RAISE EXCEPTION 'FAIL  % (expected %, got %, err=%)', label, expect_ok, ok, err; END IF;
END $$;
CREATE OR REPLACE FUNCTION pg_temp.count_as(uid uuid, r text, q text) RETURNS bigint
LANGUAGE plpgsql AS $$
DECLARE n bigint;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', COALESCE(uid::text, ''), true);
  EXECUTE 'SET LOCAL ROLE ' || r; EXECUTE q INTO n; RESET ROLE; RETURN n;
END $$;

INSERT INTO auth.users(id) VALUES
 ('aaaaaaaa-0000-4000-8000-00000000000a'),('aaaaaaaa-0000-4000-8000-00000000000b'),
 ('aaaaaaaa-0000-4000-8000-00000000000c'),('aaaaaaaa-0000-4000-8000-00000000000d');
INSERT INTO public.academies(id,name) VALUES
 ('11111111-0000-4000-8000-000000000001','A'),('11111111-0000-4000-8000-000000000002','B');
INSERT INTO public.profiles(id,role,academy_id,full_name) VALUES
 ('aaaaaaaa-0000-4000-8000-00000000000a','coach','11111111-0000-4000-8000-000000000001','Coach A1'),
 ('aaaaaaaa-0000-4000-8000-00000000000b','coach','11111111-0000-4000-8000-000000000001','Coach A2'),
 ('aaaaaaaa-0000-4000-8000-00000000000c','coach','11111111-0000-4000-8000-000000000002','Coach B1'),
 ('aaaaaaaa-0000-4000-8000-00000000000d','parent',NULL,'Parent');
INSERT INTO public.matches(id,academy_id,opponent_name,match_date,status,own_score,opponent_score,created_by) VALUES
 ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','Lawan','2026-11-01','final',1,0,'aaaaaaaa-0000-4000-8000-00000000000a'),
 ('cccccccc-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001','Lawan 2','2026-11-08','draft',NULL,NULL,'aaaaaaaa-0000-4000-8000-00000000000a');

-- helper SQL fragments
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('a',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000b')$$,true,'final match, peer reviewer -> allowed');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('a',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000b')$$,false,'duplicate hash for same match rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000002','11111111-0000-4000-8000-000000000001','r1',repeat('c',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000002"}','aaaaaaaa-0000-4000-8000-00000000000b')$$,false,'draft match cannot be snapshotted');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('d',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000a')$$,false,'self-review rejected with 2+ staff');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('e',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000c')$$,false,'reviewer from another academy rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('f',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000002"}','aaaaaaaa-0000-4000-8000-00000000000b')$$,false,'payload match_id mismatch rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1','NOT-A-HASH',repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000b')$$,false,'invalid hash format rejected');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000c','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('1',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000c')$$,false,'coach of another academy cannot snapshot');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$INSERT INTO public.report_snapshots(match_id,academy_id,payload_version,snapshot_hash,events_digest,canonical_payload,reviewed_by,created_by)
   VALUES ('cccccccc-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000001','r1',repeat('2',64),repeat('b',64),'{"match_id":"cccccccc-0000-4000-8000-000000000001"}','aaaaaaaa-0000-4000-8000-00000000000b','aaaaaaaa-0000-4000-8000-00000000000b')$$,false,'cannot spoof created_by');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$UPDATE public.report_snapshots SET payload_version='x'$$,false,'snapshot cannot be updated');
SELECT pg_temp.t('aaaaaaaa-0000-4000-8000-00000000000a','authenticated',
 $$DELETE FROM public.report_snapshots$$,false,'snapshot cannot be deleted');
SELECT pg_temp.t(NULL,'anon','SELECT count(*) FROM public.report_snapshots',false,'anon cannot read snapshots');
DO $$ BEGIN
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000c','authenticated','SELECT count(*) FROM public.report_snapshots') <> 0 THEN RAISE EXCEPTION 'FAIL other academy sees snapshots'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000d','authenticated','SELECT count(*) FROM public.report_snapshots') <> 0 THEN RAISE EXCEPTION 'FAIL parent sees snapshots'; END IF;
  IF pg_temp.count_as('aaaaaaaa-0000-4000-8000-00000000000b','authenticated','SELECT count(*) FROM public.report_snapshots') <> 1 THEN RAISE EXCEPTION 'FAIL staff of academy should see 1'; END IF;
  RAISE NOTICE 'PASS  isolation: other academy 0, parent 0, academy staff 1';
END $$;
ROLLBACK;
