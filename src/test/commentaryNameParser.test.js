import { describe, it, expect } from 'vitest';
import {
  parseSubtitleTextToCues,
  parseLineupText,
  extractPlayerNamesFromCommentary,
  attachDetectedNamesToEvents
} from '../lib/vision/commentaryNameParser';

describe('commentaryNameParser', () => {
  it('mengekstrak nama pemain dari subtitle WebVTT komentator Indonesia & Inggris', () => {
    const vtt = [
      'WEBVTT',
      '',
      '00:00:10.000 --> 00:00:14.000',
      'Umpan dari Marselino Ferdinan ke kotak penalti',
      '',
      '00:00:15.000 --> 00:00:18.500',
      'Nomor 7 Pratama Arhan melepaskan tendangan keras',
      '',
      '00:00:22.000 --> 00:00:25.000',
      'Goal by Ramadhan Sananta after a great pass from Marselino Ferdinan'
    ].join('\n');

    const cues = parseSubtitleTextToCues(vtt);
    expect(cues.length).toBe(3);

    const { detectedPlayers, mentions } = extractPlayerNamesFromCommentary(vtt, {
      teamNames: ['AMS Seyegan', 'PS Palma']
    });
    const names = detectedPlayers.map((p) => p.name);
    expect(names).toContain('Pratama Arhan');
    expect(names).toContain('Marselino Ferdinan');
    expect(names).toContain('Ramadhan Sananta');
    expect(mentions.length).toBeGreaterThanOrEqual(3);

    const arhan = detectedPlayers.find((p) => p.name === 'Pratama Arhan');
    expect(arhan?.jersey_number).toBe(7);
    expect(arhan?.slot_number).toBe(7);
  });

  it('mem-parse teks daftar susunan pemain dan mengaitkan ke event berdasarkan slot/waktu', () => {
    const lineup = '#1 Ernando Ari\n#7 Pratama Arhan\n#10 Marselino Ferdinan';
    const players = parseLineupText(lineup, ['Tim Kita']);
    expect(players.length).toBe(3);
    expect(players[0].name).toBe('Ernando Ari');
    expect(players[2].slot_number).toBe(10);

    const events = [
      { id: 'e1', team: 'own', player_number: 10, video_time_s: 12, event_type: 'pass' },
      { id: 'e2', team: 'opponent', opponent_number: 9, video_time_s: 15, event_type: 'shot' }
    ];
    const enriched = attachDetectedNamesToEvents(events, players);
    expect(enriched[0].player_name).toBe('Marselino Ferdinan');
    expect(enriched[1].player_name).toBeUndefined();
  });
});
