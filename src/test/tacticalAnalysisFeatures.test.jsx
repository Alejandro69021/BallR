import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { extractYouTubeVideoId, buildYouTubeEmbedUrl } from '../lib/youtube';
import LocalVideoPanel from '../components/video/LocalVideoPanel';
import LiveTacticalPanel from '../components/logger/LiveTacticalPanel';
import MatchVisualReplay from '../components/match/MatchVisualReplay';
import TacticalMatchAnalysis from '../components/match/TacticalMatchAnalysis';
import TacticalBoard from '../components/tactics/TacticalBoard';

const SAMPLE_MATCH = {
  id: 'match-qa-01',
  opponent_name: 'PS Palma',
  match_date: '2026-11-22',
  competition: 'Seri A | Liga Sleman 2026',
  format: '11v11',
  pitch_length_m: 90,
  pitch_width_m: 60,
  youtube_video_id: 'utJElEonijc'
};

const SAMPLE_EVENTS = [
  { id: 'e1', client_event_id: 'c1', period: 1, minute: 5, team: 'own', event_type: 'pass', outcome: 'success', x_m: 65, y_m: 10, end_x_m: 78, end_y_m: 15 },
  { id: 'e2', client_event_id: 'c2', period: 1, minute: 12, team: 'own', event_type: 'shot_on_target', outcome: 'success', x_m: 82, y_m: 30 },
  { id: 'e3', client_event_id: 'c3', period: 1, minute: 18, team: 'opponent', event_type: 'pass', outcome: 'success', x_m: 20, y_m: 50 },
  { id: 'e4', client_event_id: 'c4', period: 2, minute: 55, team: 'own', event_type: 'interception', outcome: 'success', x_m: 68, y_m: 28 },
  { id: 'e5', client_event_id: 'c5', period: 2, minute: 72, team: 'opponent', event_type: 'tackle', outcome: 'success', x_m: 70, y_m: 35 }
];

describe('QA Integration: Live & Post-Match Tactical Analysis, YouTube & 3D Replay', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. extractYouTubeVideoId parses live, watch, youtu.be, and rejects invalid URLs', () => {
    expect(extractYouTubeVideoId('https://www.youtube.com/live/utJElEonijc?si=CAGwDRkxwZavFWcJ')).toBe('utJElEonijc');
    expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=utJElEonijc')).toBe('utJElEonijc');
    expect(extractYouTubeVideoId('https://youtu.be/utJElEonijc')).toBe('utJElEonijc');
    expect(extractYouTubeVideoId('not-a-valid-url')).toBeNull();
    expect(buildYouTubeEmbedUrl('utJElEonijc', 30)).toContain('youtube-nocookie.com/embed/utJElEonijc');
  });

  it('2. LocalVideoPanel auto-loads defaultYoutubeId, allows closing and reloading via URL', () => {
    render(<LocalVideoPanel matchId="match-qa-01" defaultYoutubeId="utJElEonijc" />);

    expect(screen.getByText('Pemutar YouTube')).toBeInTheDocument();
    const iframe = screen.getByTitle('Pemutar YouTube Pertandingan');
    expect(iframe.getAttribute('src')).toContain('utJElEonijc');

    // Close YouTube embed
    fireEvent.click(screen.getByRole('button', { name: 'Tutup YouTube' }));
    expect(screen.queryByTitle('Pemutar YouTube Pertandingan')).not.toBeInTheDocument();

    // Invalid URL shows error
    const input = screen.getByLabelText('Tautan YouTube pertandingan');
    fireEvent.change(input, { target: { value: 'https://example.com/nope' } });
    fireEvent.click(screen.getByRole('button', { name: 'Muat YouTube' }));
    expect(screen.getByText(/Tautan YouTube tidak valid/i)).toBeInTheDocument();

    // Valid URL loads iframe again
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/live/utJElEonijc?si=test' } });
    fireEvent.click(screen.getByRole('button', { name: 'Muat YouTube' }));
    expect(screen.getByTitle('Pemutar YouTube Pertandingan')).toBeInTheDocument();
  });

  it('3. LiveTacticalPanel toggles open and computes live metrics from events + outbox', () => {
    const outbox = [
      { id: 'e6', client_event_id: 'c6', period: 2, minute: 80, team: 'own', event_type: 'goal', outcome: 'success', x_m: 85, y_m: 30 }
    ];
    render(<LiveTacticalPanel match={SAMPLE_MATCH} events={SAMPLE_EVENTS} outbox={outbox} />);

    const toggle = screen.getByRole('button', { name: /Analisis Live/i });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Dominasi Sepertiga Akhir')).toBeInTheDocument();
    expect(screen.getByText('n = 6')).toBeInTheDocument();
  });

  it('4. MatchVisualReplay switches 3D/2D camera, toggles layers, and steps through events', () => {
    render(<MatchVisualReplay match={SAMPLE_MATCH} events={SAMPLE_EVENTS} />);

    expect(screen.getByRole('button', { name: /3D Perspektif/i })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /2D Atas/i }));
    expect(screen.getByRole('button', { name: /2D Atas/i })).toHaveAttribute('aria-pressed', 'true');

    // Toggle layers
    const corrBtn = screen.getByRole('button', { name: '5 Koridor' });
    expect(corrBtn).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(corrBtn);
    expect(corrBtn).toHaveAttribute('aria-pressed', 'false');

    // Step forward and back
    expect(screen.getByText('1 / 5 kejadian')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Kejadian berikutnya'));
    expect(screen.getByText('2 / 5 kejadian')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Kejadian sebelumnya'));
    expect(screen.getByText('1 / 5 kejadian')).toBeInTheDocument();
  });

  it('5. TacticalMatchAnalysis renders full opponent breakdown, replay, and JSON controls', () => {
    render(<TacticalMatchAnalysis match={SAMPLE_MATCH} events={SAMPLE_EVENTS} />);

    expect(screen.getByTestId('tactical-match-analysis')).toBeInTheDocument();
    expect(screen.getByTestId('match-visual-replay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ekspor JSON/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Impor Tracking JSON/i })).toBeInTheDocument();
    expect(screen.getByText(/Ringkasan Temuan Utama Laga/i)).toBeInTheDocument();
  });

  it('6. TacticalBoard renders 3D perspective and ghost motion layer without error', () => {
    const scenario = { id: 'sc-1', pitch_length_m: 90, pitch_width_m: 60 };
    const frame1 = { players: [{ id: 'p1', team: 'own', label: '10', x: 30, y: 30 }], ball: { x: 32, y: 30 }, arrows: [] };
    const frame2 = { players: [{ id: 'p1', team: 'own', label: '10', x: 55, y: 20 }], ball: { x: 56, y: 20 }, arrows: [] };

    const { container } = render(
      <TacticalBoard scenario={scenario} frame={frame2} ghostFrame={frame1} viewMode="3d" />
    );

    expect(container.querySelector('svg')).not.toBeNull();
    // Ghost dashed line connecting (30,30) to (55,20) should be rendered
    const ghostLine = container.querySelector('line[x1="30"][y1="30"][x2="55"][y2="20"]');
    expect(ghostLine).not.toBeNull();
  });
});
