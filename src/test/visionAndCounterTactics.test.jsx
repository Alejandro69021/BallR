import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  rgbToHsv,
  fitKMeans2Deterministic,
  predictJerseyCluster,
  analyzeFrameRgba,
  inferEventsFromFrameRecords,
  parseTimecodeToSeconds,
  formatSecondsToTimecode,
  buildMatchSegments
} from '../lib/vision/browserVideoAnalyzer';
import {
  analyzePlayingTechnique,
  analyzeOpponentStrategy,
  generateCounterTactics,
  buildTacticalSummary
} from '../lib/analysis/events';
import { assertValidReference } from '../data/references';
import { validateEvent } from '../lib/matches';
import TacticalMatchAnalysis, { normalizeVisionEventsForMatch } from '../components/match/TacticalMatchAnalysis';

function createSyntheticPitchFrame(width, height, players = [], ball = null) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  // Fill entire frame with lush football turf green (RGB 42, 138, 52)
  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    rgba[p] = 42;
    rgba[p + 1] = 138;
    rgba[p + 2] = 52;
    rgba[p + 3] = 255;
  }

  // Paint player rectangles (tall aspect ratio, non-green jersey colors)
  players.forEach(({ x, y, w, h, rgb }) => {
    for (let py = y; py < y + h && py < height; py++) {
      for (let px = x; px < x + w && px < width; px++) {
        if (px < 0 || py < 0) continue;
        const p = (py * width + px) * 4;
        rgba[p] = rgb[0];
        rgba[p + 1] = rgb[1];
        rgba[p + 2] = rgb[2];
        rgba[p + 3] = 255;
      }
    }
  });

  // Paint small bright white ball
  if (ball) {
    const [bx, by] = ball;
    for (let py = by - 1; py <= by + 1; py++) {
      for (let px = bx - 1; px <= bx + 1; px++) {
        if (px < 0 || py < 0 || px >= width || py >= height) continue;
        const p = (py * width + px) * 4;
        rgba[p] = 248;
        rgba[p + 1] = 248;
        rgba[p + 2] = 248;
        rgba[p + 3] = 255;
      }
    }
  }

  return rgba;
}

const RICH_MATCH_EVENTS = [
  // Own progressive passes, key pass, and inside/outside box shots
  { id: 'e1', team: 'own', event_type: 'pass', outcome: 'success', x_m: 25, y_m: 20, end_x_m: 45, end_y_m: 22, period: 1, minute: 4 },
  { id: 'e2', team: 'own', event_type: 'pass', outcome: 'success', x_m: 45, y_m: 22, end_x_m: 66, end_y_m: 14, period: 1, minute: 6 },
  { id: 'e3', team: 'own', event_type: 'key_pass', outcome: 'success', x_m: 68, y_m: 15, end_x_m: 81, end_y_m: 28, period: 1, minute: 9 },
  { id: 'e4', team: 'own', event_type: 'shot', outcome: 'fail', x_m: 62, y_m: 30, period: 1, minute: 12 },
  { id: 'e5', team: 'own', event_type: 'shot', outcome: 'fail', x_m: 64, y_m: 34, period: 1, minute: 19 },
  { id: 'e6', team: 'own', event_type: 'ball_loss', outcome: 'fail', x_m: 16, y_m: 25, period: 1, minute: 23 },
  { id: 'e7', team: 'own', event_type: 'ball_loss', outcome: 'fail', x_m: 18, y_m: 35, period: 1, minute: 27 },
  { id: 'e8', team: 'own', event_type: 'pass', outcome: 'fail', x_m: 40, y_m: 30, end_x_m: 50, end_y_m: 32, period: 1, minute: 30 },
  { id: 'e9', team: 'own', event_type: 'pass', outcome: 'fail', x_m: 48, y_m: 25, end_x_m: 58, end_y_m: 20, period: 1, minute: 33 },
  // Opponent high defensive block, right-wing overload, dangerous buildup loss, inside-box shots
  { id: 'o1', team: 'opponent', event_type: 'tackle', outcome: 'success', x_m: 28, y_m: 52, period: 1, minute: 10 },
  { id: 'o2', team: 'opponent', event_type: 'interception', outcome: 'success', x_m: 25, y_m: 54, period: 1, minute: 14 },
  { id: 'o3', team: 'opponent', event_type: 'pass', outcome: 'success', x_m: 50, y_m: 53, end_x_m: 30, end_y_m: 55, period: 1, minute: 16 },
  { id: 'o4', team: 'opponent', event_type: 'pass', outcome: 'success', x_m: 30, y_m: 55, end_x_m: 14, end_y_m: 48, period: 1, minute: 17 },
  { id: 'o5', team: 'opponent', event_type: 'ball_loss', outcome: 'fail', x_m: 78, y_m: 32, period: 1, minute: 21 },
  { id: 'o6', team: 'opponent', event_type: 'shot_on_target', outcome: 'success', x_m: 10, y_m: 30, period: 2, minute: 52 },
  { id: 'o7', team: 'opponent', event_type: 'shot_on_target', outcome: 'success', x_m: 12, y_m: 28, period: 2, minute: 64 }
];

describe('BallR Vision Browser Analyzer & Evidence-Based Counter-Tactics', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. In-Browser Video Analyzer Core CV Primitives', () => {
    it('converts RGB turf green to expected HSV range and clusters two jersey colors deterministically', () => {
      const [h, s, v] = rgbToHsv(42, 138, 52);
      expect(h).toBeGreaterThanOrEqual(45);
      expect(h).toBeLessThanOrEqual(75);
      expect(s).toBeGreaterThan(100);
      expect(v).toBeGreaterThan(100);

      const darkTeam = Array.from({ length: 6 }, () => [28, 35, 165]);
      const lightTeam = Array.from({ length: 6 }, () => [235, 225, 40]);
      const centroids = fitKMeans2Deterministic([...darkTeam, ...lightTeam]);

      expect(centroids).not.toBeNull();
      expect(predictJerseyCluster(centroids, [30, 40, 160])).toBe(0);
      expect(predictJerseyCluster(centroids, [230, 220, 45])).toBe(1);
    });

    it('detects players and moving ball from synthetic RGBA turf frames and infers ballr-vision-v1 events', () => {
      const w = 160;
      const h = 90;
      const p1 = { x: 40, y: 40, w: 6, h: 14, rgb: [20, 30, 190] };
      const p2 = { x: 85, y: 42, w: 6, h: 14, rgb: [20, 30, 190] };
      const p3 = { x: 115, y: 44, w: 6, h: 14, rgb: [240, 220, 40] };

      const frame1 = createSyntheticPitchFrame(w, h, [p1, p2, p3], [43, 52]);
      const res1 = analyzeFrameRgba(frame1, w, h, null, null);
      expect(res1.grassCoverage).toBeGreaterThan(0.5);
      expect(res1.players.length).toBeGreaterThanOrEqual(2);

      const frame2 = createSyntheticPitchFrame(w, h, [p1, p2, p3], [88, 54]);
      const res2 = analyzeFrameRgba(frame2, w, h, res1.gray, null);
      expect(res2.ball).not.toBeNull();

      // Build clean frame records for event inference verification
      const records = [
        {
          video_time_s: 1.0,
          minute: 0.1,
          pitchBbox: [0, 0, 160, 90],
          ball: [40, 45],
          players: [
            { id: 1, px: 40, py: 46, color: [20, 30, 190] },
            { id: 2, px: 85, py: 46, color: [20, 30, 190] },
            { id: 3, px: 110, py: 46, color: [240, 220, 40] },
            { id: 4, px: 120, py: 46, color: [240, 220, 40] }
          ]
        },
        {
          video_time_s: 2.0,
          minute: 0.1,
          pitchBbox: [0, 0, 160, 90],
          ball: [85, 45],
          players: [
            { id: 1, px: 40, py: 46, color: [20, 30, 190] },
            { id: 2, px: 85, py: 46, color: [20, 30, 190] },
            { id: 3, px: 110, py: 46, color: [240, 220, 40] },
            { id: 4, px: 120, py: 46, color: [240, 220, 40] }
          ]
        },
        {
          video_time_s: 3.0,
          minute: 0.1,
          pitchBbox: [0, 0, 160, 90],
          ball: [110, 45],
          players: [
            { id: 1, px: 40, py: 46, color: [20, 30, 190] },
            { id: 2, px: 85, py: 46, color: [20, 30, 190] },
            { id: 3, px: 110, py: 46, color: [240, 220, 40] },
            { id: 4, px: 120, py: 46, color: [240, 220, 40] }
          ]
        }
      ];

      const inferred = inferEventsFromFrameRecords(records, {
        pitchLengthM: 90,
        pitchWidthM: 60,
        period: 1,
        ownCluster: 0,
        frameWidth: 160,
        frameHeight: 90
      });

      const types = inferred.map((e) => e.event_type);
      expect(types).toContain('pass');
      expect(types).toContain('ball_loss');
      expect(types).toContain('ball_recovery');
    });
  });

  describe('2. Playing Technique, Opponent Strategy & Counter-Tactics Engine', () => {
    it('reads own playing technique, diagnoses opponent high block & right-wing bias, and generates valid cited counter-tactics', () => {
      const ownTech = analyzePlayingTechnique(RICH_MATCH_EVENTS, 90, 60, 'own');
      expect(ownTech.passing.progressive_count).toBeGreaterThanOrEqual(2);
      expect(ownTech.passing.key_passes).toBe(1);
      expect(ownTech.ball_security.dangerous_losses).toBe(2);

      const oppStrat = analyzeOpponentStrategy(RICH_MATCH_EVENTS, 90, 60);
      expect(oppStrat.defensive_profile).toBe('high_block');
      expect(oppStrat.dominant_corridor.id).toBe('right_wing');
      expect(oppStrat.vulnerabilities.some((v) => v.id === 'vuln-space-behind')).toBe(true);
      expect(oppStrat.vulnerabilities.some((v) => v.id === 'vuln-buildup-turnover')).toBe(true);

      const summary = buildTacticalSummary(RICH_MATCH_EVENTS, 90, 60, 'PS Palma');
      expect(summary.counter_tactics.length).toBeGreaterThanOrEqual(4);

      const ctIds = summary.counter_tactics.map((c) => c.id);
      expect(ctIds).toContain('ct-vs-high-block');
      expect(ctIds).toContain('ct-corridor-trap');
      expect(ctIds).toContain('ct-buildup-security');
      expect(ctIds).toContain('ct-pressing-trigger');

      // Every single reference_id must pass registry validation
      summary.counter_tactics.forEach((ct) => {
        expect(() => assertValidReference(ct.reference_ids)).not.toThrow();
      });
      oppStrat.patterns.forEach((p) => {
        expect(() => assertValidReference(p.reference_ids)).not.toThrow();
      });
      oppStrat.vulnerabilities.forEach((v) => {
        expect(() => assertValidReference(v.reference_ids)).not.toThrow();
      });

      const directCt = generateCounterTactics(summary, ownTech, oppStrat, 'PS Palma');
      expect(directCt.length).toBe(summary.counter_tactics.length);
    });
  });

  describe('3. TacticalMatchAnalysis UI Integration (Browser Video, Local YouTube API & Counter-Tactics)', () => {
    const sampleMatch = {
      id: 'm-vision-1',
      opponent_name: 'PS Palma',
      match_date: '2026-11-27',
      format: '11v11',
      pitch_length_m: 90,
      pitch_width_m: 60,
      youtube_video_id: 'utJElEonijc'
    };

    it('renders technique, opponent strategy, counter-tactics, and loads /api/vision/latest payload', async () => {
      const mockLatestPayload = {
        ok: true,
        source: 'vision/ballr_analysis.json',
        data: {
          schema: 'ballr-vision-v1',
          vision_quality: {
            frames_processed: 180,
            ball_detection_rate_pct: 16.7,
            avg_players_detected: 17.6,
            model: 'BallR Pitch-Aware CV',
            disclaimer: 'Hasil estimasi otomatis.'
          },
          events: RICH_MATCH_EVENTS
        }
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockLatestPayload
      });

      render(<TacticalMatchAnalysis match={sampleMatch} events={RICH_MATCH_EVENTS} />);

      expect(screen.getByTestId('vision-automation-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('playing-technique-section')).toBeInTheDocument();
      expect(screen.getByTestId('opponent-strategy-section')).toBeInTheDocument();
      expect(screen.getByTestId('counter-tactics-section')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analisis Video MP4\/WebM/i })).toBeInTheDocument();

      // Open YouTube local form
      fireEvent.click(screen.getByRole('button', { name: /Analisis YouTube Lokal/i }));
      expect(screen.getByTestId('youtube-vision-form')).toBeInTheDocument();

      // Load latest local vision JSON
      fireEvent.click(screen.getByRole('button', { name: /Muat Vision Terbaru/i }));
      await waitFor(() => {
        expect(screen.getByTestId('vision-quality-banner')).toBeInTheDocument();
      });
      expect(global.fetch).toHaveBeenCalledWith('/api/vision/latest');
    });

    it('normalizes ballr_vision.py events (including off_target) and saves them to draft match', async () => {
      const rawVisionEvents = [
        {
          id: 'vision-evt-0001',
          period: 1,
          minute: 1.5,
          team: 'own',
          event_type: 'shot',
          outcome: 'off_target',
          x_m: 95,
          y_m: 30,
          end_x_m: 98,
          end_y_m: 30,
          video_time_s: 90.0
        },
        {
          id: 'vision-evt-0002',
          period: 1,
          minute: 2.0,
          team: 'opponent',
          opponent_number: null,
          event_type: 'ball_recovery',
          outcome: 'success',
          x_m: 40,
          y_m: 25,
          video_time_s: 120.0
        }
      ];

      const normalized = normalizeVisionEventsForMatch(rawVisionEvents, 90, 60);
      expect(normalized[0].outcome).toBe('fail');
      expect(normalized[0].x_m).toBe(90);
      expect(normalized[1].opponent_number).toBeGreaterThanOrEqual(1);
      normalized.forEach((evt) => {
        expect(validateEvent(evt, { pitch_length_m: 90, pitch_width_m: 60 })).toBe(true);
      });

      const onSave = vi.fn().mockResolvedValue(2);
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          source: 'vision/ballr_analysis.json',
          data: {
            schema: 'ballr-vision-v1',
            vision_quality: { frames_processed: 60, ball_detection_rate_pct: 20, avg_players_detected: 15 },
            events: rawVisionEvents
          }
        })
      });

      render(
        <TacticalMatchAnalysis
          match={sampleMatch}
          events={[]}
          onSaveVisionEvents={onSave}
          canSaveEvents={true}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /Muat Vision Terbaru/i }));
      await waitFor(() => {
        expect(screen.getByTestId('save-vision-to-match-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('save-vision-to-match-btn'));
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledTimes(1);
      });
      expect(onSave.mock.calls[0][0]).toHaveLength(2);
      expect(onSave.mock.calls[0][0][0].outcome).toBe('fail');
    });

    it('parses MM:SS timecodes, builds Half 1 & Half 2 segments, flips Half 2 pitch coordinates, and sends segments to /api/vision/youtube', async () => {
      expect(parseTimecodeToSeconds('01:15')).toBe(75);
      expect(parseTimecodeToSeconds('1:02:30')).toBe(3750);
      expect(parseTimecodeToSeconds('90')).toBe(90);
      expect(parseTimecodeToSeconds('01:75')).toBeNull();
      expect(parseTimecodeToSeconds('abc')).toBeNull();
      expect(formatSecondsToTimecode(75)).toBe('01:15');
      expect(formatSecondsToTimecode(3750)).toBe('1:02:30');

      const segs = buildMatchSegments({
        half1Start: '15:00',
        half1End: '17:00',
        enableHalf2: true,
        half2Start: '65:00',
        half2End: '67:00',
        flipHalf2: true
      });
      expect(segs).toHaveLength(2);
      expect(segs[0]).toMatchObject({ period: 1, startSec: 900, endSec: 1020, startMinute: 0, flipPitch: false });
      expect(segs[1]).toMatchObject({ period: 2, startSec: 3900, endSec: 4020, startMinute: 45, flipPitch: true });

      expect(() => buildMatchSegments({ half1Start: '05:00', half1End: '04:00' })).toThrow(/lebih besar/i);
      expect(() => buildMatchSegments({ half1Start: '01:00', half1End: '02:00', enableHalf2: true, half2Start: '' })).toThrow(/Babak 2 wajib/i);

      // Verify pitch flip in period 2 & no cross-period ghost pass
      const twoHalfRecords = [
        {
          period: 1,
          flipPitch: false,
          video_time_s: 10.0,
          minute: 0.2,
          pitchBbox: [0, 0, 160, 90],
          ball: [20, 15],
          players: [
            { id: 1, px: 20, py: 16, color: [20, 30, 190] },
            { id: 2, px: 60, py: 16, color: [20, 30, 190] },
            { id: 3, px: 120, py: 45, color: [240, 220, 40] },
            { id: 4, px: 130, py: 45, color: [240, 220, 40] }
          ]
        },
        {
          period: 1,
          flipPitch: false,
          video_time_s: 11.0,
          minute: 0.2,
          pitchBbox: [0, 0, 160, 90],
          ball: [60, 15],
          players: [
            { id: 1, px: 20, py: 16, color: [20, 30, 190] },
            { id: 2, px: 60, py: 16, color: [20, 30, 190] },
            { id: 3, px: 120, py: 45, color: [240, 220, 40] },
            { id: 4, px: 130, py: 45, color: [240, 220, 40] }
          ]
        },
        {
          period: 2,
          flipPitch: true,
          video_time_s: 3000.0,
          minute: 45.0,
          pitchBbox: [0, 0, 160, 90],
          ball: [140, 75],
          players: [
            { id: 10, px: 140, py: 76, color: [20, 30, 190] },
            { id: 11, px: 100, py: 76, color: [20, 30, 190] },
            { id: 12, px: 40, py: 45, color: [240, 220, 40] },
            { id: 13, px: 30, py: 45, color: [240, 220, 40] }
          ]
        },
        {
          period: 2,
          flipPitch: true,
          video_time_s: 3001.0,
          minute: 45.0,
          pitchBbox: [0, 0, 160, 90],
          ball: [100, 75],
          players: [
            { id: 10, px: 140, py: 76, color: [20, 30, 190] },
            { id: 11, px: 100, py: 76, color: [20, 30, 190] },
            { id: 12, px: 40, py: 45, color: [240, 220, 40] },
            { id: 13, px: 30, py: 45, color: [240, 220, 40] }
          ]
        }
      ];

      const twoHalfEvents = inferEventsFromFrameRecords(twoHalfRecords, {
        pitchLengthM: 90,
        pitchWidthM: 60,
        ownCluster: 0,
        frameWidth: 160,
        frameHeight: 90
      });
      // Should have exactly 2 passes (one in period 1, one in period 2) and NO ghost pass between period 1 and 2
      expect(twoHalfEvents).toHaveLength(2);
      expect(twoHalfEvents[0].period).toBe(1);
      expect(twoHalfEvents[1].period).toBe(2);
      // In period 2, raw ball moved 140 -> 100 (right-to-left on screen), flipped should move left-to-right (11.2 -> 33.7)
      expect(twoHalfEvents[1].end_x_m).toBeGreaterThan(twoHalfEvents[1].x_m);

      // Verify UI panel sends segments to /api/vision/youtube
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            schema: 'ballr-vision-v1',
            vision_quality: { frames_processed: 40, ball_detection_rate_pct: 25, avg_players_detected: 16 },
            events: RICH_MATCH_EVENTS
          }
        })
      });
      global.fetch = fetchMock;

      render(<TacticalMatchAnalysis match={sampleMatch} events={RICH_MATCH_EVENTS} />);
      expect(screen.getByTestId('vision-half-window-panel')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/Mulai Babak 1/i), { target: { value: '15:00' } });
      fireEvent.change(screen.getByLabelText(/Selesai Babak 1/i), { target: { value: '16:30' } });
      fireEvent.click(screen.getByLabelText(/Sertakan Babak 2/i));
      fireEvent.change(screen.getByLabelText(/Mulai Babak 2/i), { target: { value: '62:00' } });
      fireEvent.change(screen.getByLabelText(/Selesai Babak 2/i), { target: { value: '63:30' } });

      fireEvent.click(screen.getByRole('button', { name: /Analisis YouTube Lokal/i }));
      fireEvent.click(screen.getByRole('button', { name: /Mulai Analisis YouTube/i }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/vision/youtube',
          expect.objectContaining({ method: 'POST' })
        );
      });
      const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(sentBody.segments).toHaveLength(2);
      expect(sentBody.segments[0]).toMatchObject({ period: 1, startSec: 900, endSec: 990, flipPitch: false });
      expect(sentBody.segments[1]).toMatchObject({ period: 2, startSec: 3720, endSec: 3810, flipPitch: true });
    });

    it('displays raw yt-dlp stderr detail and sends optional browser cookies when /api/vision/youtube fails', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          ok: false,
          error: 'Unduh YouTube (yt-dlp) gagal pada Babak 1 (exit 1).',
          exit_code: 1,
          stderr_tail: 'ERROR: [youtube] utJElEonijc: Sign in to confirm you are not a bot.'
        })
      });
      global.fetch = fetchMock;

      render(<TacticalMatchAnalysis match={sampleMatch} events={RICH_MATCH_EVENTS} />);

      fireEvent.click(screen.getByRole('button', { name: /Analisis YouTube Lokal/i }));
      fireEvent.change(screen.getByLabelText(/Tautan YouTube/i), {
        target: { value: 'https://youtu.be/utJElEonijc' }
      });
      fireEvent.change(screen.getByLabelText(/Cookies browser/i), {
        target: { value: 'chrome' }
      });
      fireEvent.click(screen.getByRole('button', { name: /Mulai Analisis YouTube/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/Unduh YouTube \(yt-dlp\) gagal/i);
      });
      expect(screen.getByTestId('vision-error-detail')).toHaveTextContent(
        /utJElEonijc: Sign in to confirm you are not a bot/i
      );
      const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(sentBody.cookiesFromBrowser).toBe('chrome');
    });
  });
});
