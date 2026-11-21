-- ==============================================================================
-- Migration: 010_event_video_time.sql
-- Description: Add optional video_time_s column to match_events for local video tagging.
-- ==============================================================================

ALTER TABLE public.match_events
ADD COLUMN IF NOT EXISTS video_time_s NUMERIC(8,1) NULL
CHECK (video_time_s >= 0 AND video_time_s <= 14400);

COMMENT ON COLUMN public.match_events.video_time_s IS 'Waktu rekaman video pertandingan (detik, maks 14400 / 4 jam) saat kejadian berlangsung. Data opsional dari rekaman video lokal.';
