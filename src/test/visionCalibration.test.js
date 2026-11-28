import { describe, it, expect } from 'vitest';
import { calibrateVisionEvents } from '../lib/vision/calibrateVisionEvents';

describe('calibrateVisionEvents (Universal Vision Post-Processing)', () => {
  const sampleParticipants = [
    { player_id: 'p-gk', jersey_number: 1, player_name: 'Kiper Utama', position: 'GK', minutes_played: 90, is_starter: true },
    { player_id: 'p-cb', jersey_number: 4, player_name: 'Bek Tengah', position: 'CB', minutes_played: 90, is_starter: true },
    { player_id: 'p-cm', jersey_number: 8, player_name: 'Gelandang', position: 'CM', minutes_played: 90, is_starter: true },
    { player_id: 'p-st', jersey_number: 9, player_name: 'Penyerang', position: 'ST', minutes_played: 90, is_starter: true }
  ];

  it('auto-flips X coordinates when own shots cluster near left goal (x < 0.48 * L)', () => {
    const raw = [
      { id: '1', team: 'own', event_type: 'shot_on_target', outcome: 'success', x_m: 12, y_m: 30, minute: 10 },
      { id: '2', team: 'own', event_type: 'shot', outcome: 'off_target', x_m: 18, y_m: 28, minute: 20 },
      { id: '3', team: 'own', event_type: 'pass', outcome: 'success', x_m: 30, y_m: 30, end_x_m: 15, end_y_m: 25, minute: 25 }
    ];

    const { events, stats } = calibrateVisionEvents(raw, {
      participants: sampleParticipants,
      pitchLengthM: 90,
      pitchWidthM: 60
    });

    expect(stats.flipped).toBe(true);
    expect(events[0].x_m).toBe(78);
    expect(events[1].x_m).toBe(72);
    expect(events[2].x_m).toBe(60);
    expect(events[2].end_x_m).toBe(75);
  });

  it('does not double-flip when orientationNormalized is true or shots already attack right', () => {
    const raw = [
      { id: '1', team: 'own', event_type: 'shot_on_target', outcome: 'success', x_m: 78, y_m: 30, minute: 10 },
      { id: '2', team: 'own', event_type: 'shot', outcome: 'off_target', x_m: 74, y_m: 28, minute: 20 }
    ];

    const { events, stats } = calibrateVisionEvents(raw, {
      participants: sampleParticipants,
      pitchLengthM: 90,
      pitchWidthM: 60
    });

    expect(stats.flipped).toBe(false);
    expect(events[0].x_m).toBe(78);
  });

  it('infers failed passes when a pass is immediately followed by same-team ball_loss', () => {
    const raw = [
      { id: 'p1', team: 'own', event_type: 'pass', outcome: 'success', x_m: 40, y_m: 30, video_time_s: 10 },
      { id: 'p2', team: 'own', event_type: 'pass', outcome: 'success', x_m: 50, y_m: 30, video_time_s: 15 },
      { id: 'p3', team: 'own', event_type: 'pass', outcome: 'success', x_m: 55, y_m: 30, video_time_s: 20 },
      { id: 'p4', team: 'own', event_type: 'pass', outcome: 'success', x_m: 60, y_m: 30, video_time_s: 25 },
      { id: 'p5', team: 'own', event_type: 'pass', outcome: 'success', x_m: 65, y_m: 30, video_time_s: 30 },
      { id: 'l1', team: 'own', event_type: 'ball_loss', outcome: 'fail', x_m: 68, y_m: 30, video_time_s: 32 }
    ];

    const { events, stats } = calibrateVisionEvents(raw, {
      pitchLengthM: 90,
      pitchWidthM: 60
    });

    expect(stats.failedPassesInferred).toBe(1);
    expect(events[4].outcome).toBe('fail');
    expect(events[0].outcome).toBe('success');
  });

  it('maps unassigned own events to registered participants and never assigns shots to GK', () => {
    const raw = [
      { id: 's1', team: 'own', event_type: 'shot_on_target', outcome: 'success', x_m: 10, y_m: 30, minute: 15 },
      { id: 's2', team: 'own', event_type: 'shot', outcome: 'off_target', x_m: 78, y_m: 30, minute: 20 }
    ];

    const { events, stats } = calibrateVisionEvents(raw, {
      participants: sampleParticipants,
      pitchLengthM: 90,
      pitchWidthM: 60,
      orientationNormalized: true
    });

    expect(stats.mappedToRoster).toBe(2);
    expect(events[0].player_id).not.toBe('p-gk');
    expect(events[1].player_id).toBe('p-st');
    expect(events[1].player_name).toBe('Penyerang');
  });
});
