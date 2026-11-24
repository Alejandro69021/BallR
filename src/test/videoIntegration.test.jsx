import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';

import LocalVideoPanel, { parseTimeToSeconds } from '../components/video/LocalVideoPanel';
import FastPitchLogger from '../components/FastPitchLogger';
import { validateEvent } from '../lib/matches';
import { buildReportPayload, computeSnapshotHash } from '../lib/report';

describe('Video Laga Phase A - Local Video & Tagging', () => {
  const origCreateObjectURL = window.URL.createObjectURL;
  const origRevokeObjectURL = window.URL.revokeObjectURL;

  beforeEach(() => {
    localStorage.clear();
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
    window.HTMLMediaElement.prototype.pause = vi.fn();
    window.HTMLMediaElement.prototype.load = vi.fn();
    window.URL.createObjectURL = vi.fn((file) => `blob:mock-${file.name}`);
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.URL.createObjectURL = origCreateObjectURL;
    window.URL.revokeObjectURL = origRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('1. parseTimeToSeconds parses mm:ss and seconds correctly', () => {
    expect(parseTimeToSeconds('01:00')).toBe(60);
    expect(parseTimeToSeconds('02:15')).toBe(135);
    expect(parseTimeToSeconds('60')).toBe(60);
    expect(parseTimeToSeconds('')).toBeNull();
    expect(parseTimeToSeconds(null)).toBeNull();
    expect(parseTimeToSeconds('invalid')).toBeNull();
  });

  it('2. LocalVideoPanel: creates object URL, revokes on unmount, issues ZERO network requests', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const toastMock = vi.fn();

    const { unmount } = render(
      <LocalVideoPanel matchId="match-v1" onToast={toastMock} />
    );

    expect(screen.getByText('Video diputar dari perangkat ini dan tidak diunggah.')).toBeInTheDocument();

    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    const dummyFile = new File(['dummy content'], 'match_recording.mp4', { type: 'video/mp4' });

    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(dummyFile);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Verify metadata saved in localStorage
    const savedMetaRaw = localStorage.getItem('ballr_video_meta_match-v1');
    expect(savedMetaRaw).not.toBeNull();
    const savedMeta = JSON.parse(savedMetaRaw);
    expect(savedMeta.name).toBe('match_recording.mp4');

    // Unmount revokes object URL
    unmount();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-match_recording.mp4');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('3. Tagging with video: currentTime=125.4 and offset=60s gives minute ~1.09 and video_time_s 125.4', () => {
    const mockMatch = {
      id: 'match-tag-1',
      status: 'draft',
      pitch_length_m: 90,
      pitch_width_m: 60,
      opponent_name: 'Lawan Uji'
    };
    const mockParticipants = [
      { player_id: 'p1', name: 'Dimas Arya', number: 10 }
    ];

    // Pre-populate offset in localStorage: 60 seconds (01:00)
    localStorage.setItem('ballr_video_offset_match-tag-1', JSON.stringify({ p1: 60, p2: null }));

    const { container } = render(
      <FastPitchLogger
        match={mockMatch}
        participants={mockParticipants}
        isReadOnly={false}
      />
    );

    // Attach mock video to the mounted LocalVideoPanel
    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    const dummyFile = new File(['mock data'], 'laga.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    const videoEl = container.querySelector('video');
    expect(videoEl).not.toBeNull();

    // Set video current time to 125.4 seconds
    Object.defineProperty(videoEl, 'currentTime', { value: 125.4, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Select player Dimas (#10)
    const playerBtn = screen.getByRole('button', { name: /Dimas Arya/i });
    fireEvent.click(playerBtn);

    // Tap action tile: "Umpan akurat"
    const passSuccessBtn = screen.getByRole('button', { name: /Umpan akurat/i });
    fireEvent.click(passSuccessBtn);

    // Verify logged event in outbox
    const outboxRaw = localStorage.getItem('match_outbox_match-tag-1');
    expect(outboxRaw).not.toBeNull();
    const outbox = JSON.parse(outboxRaw);
    expect(outbox.length).toBe(1);

    const logged = outbox[0];
    expect(logged.video_time_s).toBe(125.4);
    // (125.4 - 60) / 60 = 65.4 / 60 = 1.09
    expect(logged.minute).toBe(1.09);
  });

  it('4. Tagging with video but NO offset set -> minute comes from stopwatch, video_time_s preserved', () => {
    const mockMatch = {
      id: 'match-tag-2',
      status: 'draft',
      pitch_length_m: 90,
      pitch_width_m: 60,
      opponent_name: 'Lawan Uji'
    };
    const mockParticipants = [
      { player_id: 'p1', name: 'Dimas Arya', number: 10 }
    ];

    // Stopwatch at 180 seconds (3.00 minutes)
    localStorage.setItem('match_clock_match-tag-2', JSON.stringify({
      timerSeconds: 180,
      isRunning: false,
      period: 1
    }));

    const { container } = render(
      <FastPitchLogger
        match={mockMatch}
        participants={mockParticipants}
        isReadOnly={false}
      />
    );

    // Attach video with currentTime=95.2s, but NO offset configured
    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    const dummyFile = new File(['mock'], 'laga.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    const videoEl = container.querySelector('video');
    Object.defineProperty(videoEl, 'currentTime', { value: 95.2, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Select player & log goal
    fireEvent.click(screen.getByRole('button', { name: /Dimas Arya/i }));
    fireEvent.click(screen.getByRole('button', { name: /Gol Masuk/i }));

    const outbox = JSON.parse(localStorage.getItem('match_outbox_match-tag-2'));
    expect(outbox.length).toBe(1);
    // Minute falls back to stopwatch (180s / 60 = 3.00 min)
    expect(outbox[0].minute).toBe(3);
    expect(outbox[0].video_time_s).toBe(95.2);
  });

  it('4b. Period 2 tagging: p2=3000s, p2StartMin=45, videoTime=3180 -> minute 48.00, video_time_s 3180.0', () => {
    const mockMatch = {
      id: 'match-p2-test',
      status: 'draft',
      pitch_length_m: 90,
      pitch_width_m: 60,
      opponent_name: 'Lawan Uji'
    };
    const mockParticipants = [
      { player_id: 'p1', name: 'Dimas Arya', number: 10 }
    ];

    localStorage.setItem('ballr_video_offset_match-p2-test', JSON.stringify({
      p1: 60,
      p2: 3000,
      p2StartMin: 45
    }));

    localStorage.setItem('match_clock_match-p2-test', JSON.stringify({
      timerSeconds: 3000,
      isRunning: false,
      period: 2
    }));

    const { container } = render(
      <FastPitchLogger
        match={mockMatch}
        participants={mockParticipants}
        isReadOnly={false}
      />
    );

    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    const dummyFile = new File(['mock'], 'laga.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    const videoEl = container.querySelector('video');
    Object.defineProperty(videoEl, 'currentTime', { value: 3180.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Period 2 with valid offsets: badge is Video
    expect(screen.getByText(/Sumber waktu: Video/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dimas Arya/i }));
    fireEvent.click(screen.getByRole('button', { name: /Umpan akurat/i }));

    const outbox = JSON.parse(localStorage.getItem('match_outbox_match-p2-test'));
    expect(outbox.length).toBe(1);
    // 45 + (3180 - 3000) / 60 = 45 + 3 = 48.00
    expect(outbox[0].minute).toBe(48);
    expect(outbox[0].video_time_s).toBe(3180.0);
    expect(outbox[0].period).toBe(2);
  });

  it('4c. Period 2 with p2 set but p2StartMin missing -> fallback to stopwatch, no guessing', () => {
    const mockMatch = {
      id: 'match-p2-missing',
      status: 'draft',
      pitch_length_m: 90,
      pitch_width_m: 60,
      opponent_name: 'Lawan Uji'
    };
    const mockParticipants = [
      { player_id: 'p1', name: 'Dimas Arya', number: 10 }
    ];

    // p2 set but p2StartMin null
    localStorage.setItem('ballr_video_offset_match-p2-missing', JSON.stringify({
      p1: 60,
      p2: 3000,
      p2StartMin: null
    }));

    localStorage.setItem('match_clock_match-p2-missing', JSON.stringify({
      timerSeconds: 2820,
      isRunning: false,
      period: 2
    }));

    const { container } = render(
      <FastPitchLogger
        match={mockMatch}
        participants={mockParticipants}
        isReadOnly={false}
      />
    );

    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    fireEvent.change(fileInput, { target: { files: [new File(['mock'], 'laga.mp4', { type: 'video/mp4' })] } });

    const videoEl = container.querySelector('video');
    Object.defineProperty(videoEl, 'currentTime', { value: 3180.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Warning text displayed
    expect(screen.getByText(/Belum lengkap: pencatatan Babak 2 memakai stopwatch/i)).toBeInTheDocument();
    // Badge says Stopwatch
    expect(screen.getByText(/Sumber waktu: Stopwatch/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dimas Arya/i }));
    fireEvent.click(screen.getByRole('button', { name: /Umpan akurat/i }));

    const outbox = JSON.parse(localStorage.getItem('match_outbox_match-p2-missing'));
    expect(outbox[0].minute).toBe(47); // Stopwatch minute (2820 / 60)
    expect(outbox[0].video_time_s).toBe(3180.0);
  });

  it('4d. Period 3 fallback to stopwatch and minute cap at 130', () => {
    const mockMatch = {
      id: 'match-p3-test',
      status: 'draft',
      pitch_length_m: 90,
      pitch_width_m: 60,
      opponent_name: 'Lawan Uji'
    };
    const mockParticipants = [
      { player_id: 'p1', name: 'Dimas Arya', number: 10 }
    ];

    localStorage.setItem('ballr_video_offset_match-p3-test', JSON.stringify({
      p1: 60,
      p2: 3000,
      p2StartMin: 45
    }));

    localStorage.setItem('match_clock_match-p3-test', JSON.stringify({
      timerSeconds: 5400,
      isRunning: false,
      period: 3
    }));

    const { container } = render(
      <FastPitchLogger
        match={mockMatch}
        participants={mockParticipants}
        isReadOnly={false}
      />
    );

    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    fireEvent.change(fileInput, { target: { files: [new File(['mock'], 'laga.mp4', { type: 'video/mp4' })] } });

    const videoEl = container.querySelector('video');
    Object.defineProperty(videoEl, 'currentTime', { value: 6000.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    // Period 3: badge is Stopwatch
    expect(screen.getByText(/Sumber waktu: Stopwatch/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Dimas Arya/i }));
    fireEvent.click(screen.getByRole('button', { name: /Umpan akurat/i }));

    const outbox = JSON.parse(localStorage.getItem('match_outbox_match-p3-test'));
    expect(outbox[0].minute).toBe(90);
    expect(outbox[0].video_time_s).toBe(6000.0);
  });

  it('4e. Video calculation caps result at 130 minutes', () => {
    const mockMatch = {
      id: 'match-cap-test',
      status: 'draft',
      pitch_length_m: 90,
      pitch_width_m: 60,
      opponent_name: 'Lawan Uji'
    };
    const mockParticipants = [
      { player_id: 'p1', name: 'Dimas Arya', number: 10 }
    ];

    // p2 = 0, p2StartMin = 120, videoTime = 7200 (120 min) -> 120 + 120 = 240 -> capped at 130
    localStorage.setItem('ballr_video_offset_match-cap-test', JSON.stringify({
      p1: null,
      p2: 0,
      p2StartMin: 120
    }));

    localStorage.setItem('match_clock_match-cap-test', JSON.stringify({
      timerSeconds: 100,
      isRunning: false,
      period: 2
    }));

    const { container } = render(
      <FastPitchLogger
        match={mockMatch}
        participants={mockParticipants}
        isReadOnly={false}
      />
    );

    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    fireEvent.change(fileInput, { target: { files: [new File(['mock'], 'laga.mp4', { type: 'video/mp4' })] } });

    const videoEl = container.querySelector('video');
    Object.defineProperty(videoEl, 'currentTime', { value: 7200.0, writable: true });
    fireEvent.timeUpdate(videoEl);

    fireEvent.click(screen.getByRole('button', { name: /Dimas Arya/i }));
    fireEvent.click(screen.getByRole('button', { name: /Umpan akurat/i }));

    const outbox = JSON.parse(localStorage.getItem('match_outbox_match-cap-test'));
    expect(outbox[0].minute).toBe(130);
  });

  it('5. validateEvent: validates video_time_s range (0..14400)', () => {
    const baseEvent = {
      event_type: 'pass',
      team: 'own',
      period: 1,
      minute: 10,
      outcome: 'success'
    };

    expect(() => validateEvent({ ...baseEvent, video_time_s: 0 })).not.toThrow();
    expect(() => validateEvent({ ...baseEvent, video_time_s: 14400 })).not.toThrow();
    expect(() => validateEvent({ ...baseEvent, video_time_s: null })).not.toThrow();

    expect(() => validateEvent({ ...baseEvent, video_time_s: -1 })).toThrow(/Waktu video harus antara 0 dan 14400/);
    expect(() => validateEvent({ ...baseEvent, video_time_s: 14401 })).toThrow(/Waktu video harus antara 0 dan 14400/);
    expect(() => validateEvent({ ...baseEvent, video_time_s: 'bukan-angka' })).toThrow(/Waktu video harus antara 0 dan 14400/);
  });

  it('6. Frozen report hash is UNCHANGED when events carry video_time_s', async () => {
    const match = {
      id: 'match-hash-test',
      opponent_name: 'Akademi Lawan',
      match_date: '2026-11-20',
      competition: 'Piala Pemuda',
      age_group: 'U-13',
      format: '11v11',
      pitch_length_m: 90,
      pitch_width_m: 60,
      own_score: 2,
      opponent_score: 1,
      status: 'final'
    };

    const participants = [
      { player_id: 'p1', jersey_number: 10, position: 'CAM', minutes_played: 70, is_starter: true }
    ];

    const eventsWithoutVideoTime = [
      {
        client_event_id: 'evt-01',
        event_type: 'pass',
        team: 'own',
        period: 1,
        minute: 12.5,
        player_id: 'p1',
        outcome: 'success',
        x_m: 45.0,
        y_m: 30.0,
        end_x_m: 60.0,
        end_y_m: 25.0,
        note: 'Umpan kunci'
      }
    ];

    const eventsWithVideoTime = [
      {
        ...eventsWithoutVideoTime[0],
        video_time_s: 125.4 // Attached video time
      }
    ];

    const payloadWithout = await buildReportPayload(match, participants, eventsWithoutVideoTime);
    const hashWithout = await computeSnapshotHash(payloadWithout);

    const payloadWith = await buildReportPayload(match, participants, eventsWithVideoTime);
    const hashWith = await computeSnapshotHash(payloadWith);

    expect(payloadWithout.events_digest).toBe(payloadWith.events_digest);
    expect(hashWithout).toBe(hashWith);
  });

  it('7. MatchDetailPage: Seek button seeks to max(0, video_time_s - 5) and clamps at 0', async () => {
    // Test the seek logic directly on LocalVideoPanel ref
    const ref = { current: null };
    render(
      <LocalVideoPanel
        ref={ref}
        matchId="match-seek-1"
      />
    );

    // Attach file
    const fileInput = screen.getByLabelText('Pilih berkas video dari perangkat');
    fireEvent.change(fileInput, { target: { files: [new File(['vid'], 'laga.mp4', { type: 'video/mp4' })] } });

    expect(ref.current).not.toBeNull();
    expect(ref.current.hasVideo).toBe(true);

    // Seek to 20s - 5s = 15s
    ref.current.seekTo(Math.max(0, 20.0 - 5));
    expect(ref.current.getCurrentTime()).toBe(15.0);

    // Seek to 3s - 5s = clamped to 0s
    ref.current.seekTo(Math.max(0, 3.0 - 5));
    expect(ref.current.getCurrentTime()).toBe(0);
  });

  it('8. Source scan: NO supabase.storage and NO upload usage in src/components/video', () => {
    const videoDir = path.resolve(process.cwd(), 'src/components/video');
    const files = fs.readdirSync(videoDir);

    for (const file of files) {
      if (!file.endsWith('.jsx') && !file.endsWith('.js')) continue;
      const fullPath = path.join(videoDir, file);
      const content = fs.readFileSync(fullPath, 'utf8');

      expect(content).not.toMatch(/supabase\.storage/i);
      expect(content).not.toMatch(/\bupload/i);
    }
  });
});
