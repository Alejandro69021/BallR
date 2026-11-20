import { describe, it, expect } from 'vitest';
import {
  calculateAccuracy,
  formatSecondsToTime,
  derivePositionGroup,
  transformDbPlayer
} from '../lib/calculations';

describe('calculateAccuracy', () => {
  it('returns 0 when denominator is 0 or negative', () => {
    expect(calculateAccuracy(5, 0)).toBe(0);
    expect(calculateAccuracy(5, -1)).toBe(0);
  });

  it('calculates correct rounded percentage', () => {
    expect(calculateAccuracy(21, 25)).toBe(84);
    expect(calculateAccuracy(1, 3)).toBe(33);
    expect(calculateAccuracy(2, 3)).toBe(67);
  });
});

describe('formatSecondsToTime', () => {
  it('formats zero and negative correctly', () => {
    expect(formatSecondsToTime(0)).toBe('00:00');
    expect(formatSecondsToTime(-5)).toBe('00:00');
  });

  it('formats regular match timestamps accurately', () => {
    expect(formatSecondsToTime(864)).toBe('14:24');
    expect(formatSecondsToTime(65)).toBe('01:05');
    expect(formatSecondsToTime(2700)).toBe('45:00');
  });
});

describe('derivePositionGroup', () => {
  it('correctly categorizes player positions', () => {
    expect(derivePositionGroup('Goalkeeper')).toBe('GK');
    expect(derivePositionGroup('Centre Back (CB)')).toBe('DEF');
    expect(derivePositionGroup('Attacking Midfielder (CAM)')).toBe('MID');
    expect(derivePositionGroup('Striker (ST)')).toBe('FWD');
    expect(derivePositionGroup('')).toBe('MID');
  });
});

describe('transformDbPlayer', () => {
  it('handles empty database payload without crashing', () => {
    const result = transformDbPlayer({}, null, false);
    expect(result).toBeDefined();
    expect(result.personal_info.full_name).toBe('Atlet Muda');
    expect(result.verified_moments).toEqual([]);
    expect(result.radar_attributes).toHaveLength(6);
  });

  it('transforms complete player record with assessment and fitness history', () => {
    const rawDbPlayer = {
      id: 'uuid-1234',
      public_id: 'WK-2026-0042',
      full_name: 'Dimas Arya Pratama',
      nickname: 'Arya',
      jersey_number: 10,
      position: 'Attacking Midfielder (CAM)',
      birth_date: '2013-05-14',
      age: 13,
      preferred_foot: 'Both',
      height_cm: 158,
      weight_kg: 46,
      photo_url: 'https://example.com/dimas.jpg',
      player_assessments: [
        {
          id: 'assess-1',
          period_month: 'Oktober 2026',
          coach_name: 'Coach Hendro',
          pace: 84,
          shooting: 78,
          passing: 86,
          dribbling: 83,
          defending: 68,
          physical: 76,
          ai_narrative: 'Bagus dalam scanning ruang.',
          strengths: ['Visi umpan', 'Kontrol'],
          growth_areas: ['Duel fisik'],
          recommended_drill: { title: 'Wall Pass' },
          is_published: true
        }
      ],
      fitness_records: [
        {
          id: 'fit-1',
          test_date: '2026-10-24',
          vertical_jump_cm: 44.5,
          sprint_20m_sec: 3.42,
          shuttle_run_sec: 11.2,
          yoyo_score: 'Level 15.4'
        }
      ],
      video_highlights: [
        {
          id: 'vid-1',
          title: 'Assist Terobosan',
          match_opponent: 'Sleman United U-13',
          match_minute: 24,
          event_type: 'Key Pass',
          video_url: 'https://example.com/vid1.mp4',
          thumbnail_url: 'https://example.com/thumb1.jpg'
        }
      ]
    };

    const transformed = transformDbPlayer(rawDbPlayer, null, false);

    expect(transformed.player_id).toBe('uuid-1234');
    expect(transformed.public_id).toBe('WK-2026-0042');
    expect(transformed.personal_info.full_name).toBe('Dimas Arya Pratama');
    expect(transformed.personal_info.position_group).toBe('MID');
    expect(transformed.fitness_benchmarks.vertical_jump_cm).toBe(44.5);
    expect(transformed.fitness_benchmarks.sprint_20m_sec).toBe(3.42);
    expect(transformed.verified_moments).toHaveLength(1);
    expect(transformed.verified_moments[0].title).toBe('Assist Terobosan');
    expect(transformed.ai_coach_evaluation.narrative).toBe('Bagus dalam scanning ruang.');
  });
});
