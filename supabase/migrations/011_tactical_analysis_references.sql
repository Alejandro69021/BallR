-- ==============================================================================
-- Migration: 011_tactical_analysis_references.sql
-- Description: Seed peer-reviewed match analysis & FIFA Football Language
--              references into public.references for live & post-match analysis.
-- ==============================================================================

INSERT INTO public.references (id, title, publisher, year, type, url, status, verified_on, notes)
VALUES
  (
    'sarmento-2014-match-analysis',
    'Match analysis in football: a systematic review',
    'Sarmento H, Marcelino R, Anguera MT, Campaniço J, Matos N, Leitão JC. Journal of Sports Sciences 32(20):1831-1843',
    '2014',
    'paper',
    'https://pubmed.ncbi.nlm.nih.gov/24787442/',
    'located',
    '',
    'Systematic review of descriptive and comparative match analysis variables (spatial zones, match half, situational context).'
  ),
  (
    'vogelbein-2014-defensive-transition',
    'Defensive transition in soccer - are prompt possession regains a measure of success? A quantitative analysis of German Fußball-Bundesliga 2010/2011',
    'Vogelbein M, Nopp S, Hökelmann A. Journal of Sports Sciences 32(11):1076-1083',
    '2014',
    'paper',
    'https://pubmed.ncbi.nlm.nih.gov/24506111/',
    'located',
    '',
    'Operationalises defensive transition and prompt ball recovery after losing possession; adult Bundesliga baseline, use descriptively for youth.'
  ),
  (
    'pollard-reep-1997-playing-strategies',
    'Measuring the effectiveness of playing strategies at soccer',
    'Pollard R, Reep C. Journal of the Royal Statistical Society: Series D (The Statistician) 46(4):541-550',
    '1997',
    'paper',
    'https://www.researchgate.net/publication/227692321_Measuring_the_effectiveness_of_playing_strategies_at_soccer',
    'located',
    '',
    'Notational analysis of team possessions and shot location/distance influence on scoring probability.'
  ),
  (
    'rathke-2017-shot-efficiency',
    'An examination of expected goals and shot efficiency in soccer',
    'Rathke A. Journal of Human Sport and Exercise 12(Proc2):S514-S529',
    '2017',
    'paper',
    'https://www.mendeley.com/catalogue/c1bf7664-7145-38b5-bb51-ee5efc5f6813/',
    'located',
    '',
    'Examines shot distance and angle from goal; BallR uses transparent shot-zone and distance breakdown rather than pro-calibrated xG.'
  ),
  (
    'fifa-football-language-2022',
    'The FIFA Football Language',
    'FIFA Training Centre',
    '2022',
    'framework',
    'https://www.fifatrainingcentre.com/en/game/performance-analysis/football-language-analysis/the-fifa-football-language.php',
    'located',
    '',
    'Universal analytical framework for breaking down in-possession, out-of-possession, defensive blocks (low/mid/high), and line-breaking progression.'
  )
ON CONFLICT (id) DO NOTHING;
