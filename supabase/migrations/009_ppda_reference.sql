-- ==============================================================================
-- Migration: 009_ppda_reference.sql
-- Description: Insert Trainor PPDA (2014) reference into public.references.
-- ==============================================================================

INSERT INTO public.references (id, title, publisher, year, type, url, status, verified_on, notes)
VALUES (
    'trainor-ppda-2014',
    'Defensive Metrics: Measuring the Intensity of a High Press (PPDA)',
    'Trainor C. StatsBomb',
    '2014',
    'standard',
    'https://statsbomb.com/?p=10118',
    'located',
    '',
    'Proxy based on on-ball events only. Not verified by us.'
)
ON CONFLICT (id) DO NOTHING;
