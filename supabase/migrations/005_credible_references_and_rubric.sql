-- ==============================================================================
-- Migration: 005_credible_references_and_rubric.sql
-- Description: Standardized references registry (seeded exactly from docs/REFERENCES_SEED.md)
--              and empty structure for curriculum rubric indicators.
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. References Registry Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.references (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    publisher TEXT NOT NULL DEFAULT '',
    year TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('curriculum', 'framework', 'paper', 'law', 'standard')),
    url TEXT NOT NULL DEFAULT '',
    section TEXT NOT NULL DEFAULT '',
    verified_on TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN ('located', 'unverified')),
    notes TEXT NOT NULL DEFAULT '',
    next_review_due TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_references_type ON public.references(type);
CREATE INDEX IF NOT EXISTS idx_references_status ON public.references(status);

-- -----------------------------------------------------------------------------
-- Seed: Exact entries from docs/REFERENCES_SEED.md
-- -----------------------------------------------------------------------------
INSERT INTO public.references (id, title, publisher, year, type, url, section, verified_on, status, notes)
VALUES
  (
    'pssi-kurikulum-filanesia',
    'Kurikulum Pembinaan Sepak Bola Indonesia (Filanesia)',
    'PSSI (Persatuan Sepakbola Seluruh Indonesia); Danurwindo et al.',
    '',
    'curriculum',
    '',
    '',
    '',
    'unverified',
    'Original PDF must be supplied in docs/source/. Secondary summary: https://www.goodnewsfromindonesia.id/2018/05/06/inilah-filosofi-sepak-bola-indonesia'
  ),
  (
    'fifa-tcp-spiralling-up',
    'Spiralling up: The long-term development process',
    'FIFA Talent Coach Programme - Training Framework',
    '2024',
    'framework',
    'https://www.fifatrainingcentre.com/en/practice/talent-coach-programme/training-framework/spiralling-up--the-long-term-development-process.php',
    '',
    '',
    'located',
    'Describes a spiral curriculum for long-term development.'
  ),
  (
    'fifa-tcp-scales-of-the-game',
    'Scales of the game: Using different lenses to improve player development',
    'FIFA Talent Coach Programme - Training Framework',
    '2024',
    'framework',
    'https://fifatrainingcentre.com/en/practice/talent-coach-programme/training-framework/scales-of-the-game.php',
    '',
    '',
    'located',
    'Player, unit and team scales.'
  ),
  (
    'fifa-grassroots-general-principles',
    'General Principles: Creating a fun, safe and effective playing environment (Principles 1-3)',
    'FIFA Grassroots Coaching Essentials',
    '2025',
    'framework',
    'https://fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/jene-general-principles-1.php',
    'Principles 1-3',
    '',
    'located',
    'Ages 6-15. Part 2 (principles 4-6): https://www.fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/jene-general-principles-2.php'
  ),
  (
    'fifa-grassroots-play-practice-play',
    'Ages 4-8: An introduction to Play-Practice-Play',
    'FIFA Grassroots Coaching Essentials',
    '2025',
    'framework',
    'https://www.fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/an-introduction-to-play-practice-play.php',
    '',
    '',
    'located',
    'Written for ages 4-8; check age applicability before using for U-13.'
  ),
  (
    'fifa-grassroots-progressive-12-15',
    'Ages 12-15: Introduction to the progressive methodology',
    'FIFA Grassroots Coaching Essentials',
    '2025',
    'framework',
    'https://www.fifatrainingcentre.com/en/practice/grassroots/grassroots-and-youth-football-essentials/grassroots-coaching-essentials/introduction-to-the-progressive-methodology.php',
    '',
    '',
    'located',
    ''
  ),
  (
    'biobanding-review',
    'Review of maturity-matching and bio-banding in youth sport',
    '',
    '',
    'paper',
    'https://core.ac.uk/download/334409909.pdf',
    '',
    '',
    'located',
    'States percentage of predicted adult height as the maturity estimate of choice.'
  ),
  (
    'sweeney-2023-maturation-position',
    'The selection advantages associated with advanced biological maturation vary according to playing position in national-level youth soccer',
    'Sweeney L, Cumming SP, MacNamara A, Horan D',
    '2023',
    'paper',
    'https://pmc.ncbi.nlm.nih.gov/articles/PMC10286617',
    '',
    '',
    'located',
    '159 players U13-U16, Football Association of Ireland pathway; Khamis-Roche %PAH.'
  ),
  (
    'hill-2020-relative-age-maturation',
    'Relative age and maturation selection biases in academy football',
    'Hill M, Scott S, Malina RM, McGee D, Cumming SP. Journal of Sports Sciences 38(11-12)',
    '2020',
    'paper',
    'https://eprints.leedsbeckett.ac.uk/id/eprint/9001/7/RelativeAgeAndMaturationSelectionBiasesInAcademyFootballAM-HILL.pdf',
    '',
    '',
    'located',
    ''
  ),
  (
    'somatic-maturity-method-comparison',
    'Estimating somatic maturity in adolescent soccer players: Methodological comparisons',
    '',
    '',
    'paper',
    'https://ray.yorksj.ac.uk/5319/1/Estimating%20somatic%20maturity%20in%20adolescent%20soccer%20players%20Methodlogical%20comparisons.pdf',
    '',
    '',
    'located',
    'Reports that maturity-offset and predicted-adult-height methods should not be used interchangeably; apply one consistently.'
  ),
  (
    'khamis-roche-1994',
    'Predicting adult stature without using skeletal age: the Khamis-Roche method',
    'Khamis HJ, Roche AF',
    '1994',
    'paper',
    '',
    '',
    '',
    'unverified',
    'Cited by the secondary sources above. Primary publication and coefficient tables must be supplied by the owner in docs/data/. Reported median error about 2.2 cm per Premier League Growth Study slides (Cumming, SPRINZ).'
  ),
  (
    'vaep-decroos-2019',
    'Actions Speak Louder than Goals: Valuing Player Actions in Soccer',
    'Decroos T, Bransen L, Van Haaren J, Davis J. KDD 2019',
    '2019',
    'paper',
    'https://arxiv.org/abs/1802.07127',
    '',
    '',
    'located',
    'Not used as a displayed metric in this app; reference only.'
  ),
  (
    'socceraction-docs',
    'socceraction - VAEP documentation',
    'KU Leuven ML-KULeuven / socceraction',
    '',
    'standard',
    'https://socceraction.readthedocs.io/en/latest/documentation/valuing_actions/vaep.html',
    '',
    '',
    'located',
    'SPADL action language. Reference for future event-data export only.'
  ),
  (
    'fifa-epts-data-format',
    'EPTS Standard Data Format',
    'FIFA',
    '',
    'standard',
    'https://inside.fifa.com/innovation/standards/epts/research-development-epts-standard-data-format',
    '',
    '',
    'located',
    'Standard for tracking-data transfer.'
  ),
  (
    'cdf-2025',
    'Common Data Format (CDF): A Standardized Format for Match-Data in Football (Soccer)',
    'Anzer G, Arnsmeyer K, Bauer P, Bekkers J, Brefeld U, Davis J, et al.',
    '2025',
    'standard',
    'https://arxiv.org/pdf/2505.15820',
    '',
    '',
    'located',
    ''
  ),
  (
    'uu-pdp-27-2022-pasal-25',
    'Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, Pasal 25',
    'Republik Indonesia',
    '2022',
    'law',
    'https://id.wikisource.org/wiki/Undang-Undang_Republik_Indonesia_Nomor_27_Tahun_2022',
    'Pasal 25 ayat (1)-(2): pemrosesan data pribadi anak wajib mendapat persetujuan orang tua dan/atau wali',
    '',
    'located',
    'Wikisource copy; confirm against the official gazette. Legal review required.'
  ),
  (
    'pp-33-2026',
    'Peraturan Pemerintah No. 33 Tahun 2026 (pelaksanaan UU PDP)',
    'Pemerintah Republik Indonesia',
    '2026',
    'law',
    'https://teknologi.bisnis.com/read/20260829/84/1999753/aturan-turunan-uu-pdp-persetujuan-data-konsumen-lebih-ketat',
    '',
    '',
    'unverified',
    'Only a news report was found; the regulation text has not been read. Do not cite specific articles until reviewed by legal counsel.'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  publisher = EXCLUDED.publisher,
  year = EXCLUDED.year,
  type = EXCLUDED.type,
  url = EXCLUDED.url,
  section = EXCLUDED.section,
  verified_on = EXCLUDED.verified_on,
  status = EXCLUDED.status,
  notes = EXCLUDED.notes;

-- -----------------------------------------------------------------------------
-- 2. Curriculum Rubric Indicators Table (Empty structure only, awaiting PDF)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rubric_indicators (
    id TEXT PRIMARY KEY,
    age_group TEXT NOT NULL,
    domain TEXT NOT NULL,
    indicator_text TEXT NOT NULL,
    reference_id TEXT NOT NULL REFERENCES public.references(id) ON DELETE CASCADE,
    page TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rubric_indicators_age_group ON public.rubric_indicators(age_group);
CREATE INDEX IF NOT EXISTS idx_rubric_indicators_ref ON public.rubric_indicators(reference_id);

-- -----------------------------------------------------------------------------
-- 3. Assessment Rubric Scores Table (Empty structure only)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_rubric_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.player_assessments(id) ON DELETE CASCADE,
    indicator_id TEXT NOT NULL REFERENCES public.rubric_indicators(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 4),
    descriptor_note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assessment_id, indicator_id)
);

CREATE INDEX IF NOT EXISTS idx_rubric_scores_assessment ON public.assessment_rubric_scores(assessment_id);

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
ALTER TABLE public.references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubric_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_rubric_scores ENABLE ROW LEVEL SECURITY;

-- References & Indicators: Read-only for all, write for Admin
CREATE POLICY "references_select_all" ON public.references FOR SELECT USING (true);
CREATE POLICY "references_admin_all" ON public.references FOR ALL TO authenticated
  USING (public.auth_profile_role() = 'admin')
  WITH CHECK (public.auth_profile_role() = 'admin');

CREATE POLICY "rubric_indicators_select_all" ON public.rubric_indicators FOR SELECT USING (true);
CREATE POLICY "rubric_indicators_admin_all" ON public.rubric_indicators FOR ALL TO authenticated
  USING (public.auth_profile_role() = 'admin')
  WITH CHECK (public.auth_profile_role() = 'admin');

-- Assessment Rubric Scores: Coaches write, parents read own child
CREATE POLICY "rubric_scores_select" ON public.assessment_rubric_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.player_assessments pa
      JOIN public.players p ON p.id = pa.player_id
      WHERE pa.id = assessment_rubric_scores.assessment_id
        AND (
          p.visibility_tier = 'public'
          OR public.auth_is_coach_of_player(p.id)
          OR public.auth_is_guardian_of(p.id)
          OR public.auth_profile_role() = 'admin'
        )
    )
  );

CREATE POLICY "rubric_scores_coach_write" ON public.assessment_rubric_scores FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.player_assessments pa
      WHERE pa.id = assessment_rubric_scores.assessment_id
        AND (public.auth_is_coach_of_player(pa.player_id) OR public.auth_profile_role() = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.player_assessments pa
      WHERE pa.id = assessment_rubric_scores.assessment_id
        AND (public.auth_is_coach_of_player(pa.player_id) OR public.auth_profile_role() = 'admin')
    )
  );
