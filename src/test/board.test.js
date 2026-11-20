import { describe, it, expect } from 'vitest';
import {
  formationTemplates,
  clampToPitch,
  moveBy,
  calculateEasing,
  interpolateFrame,
  validateFrame,
  BOARD_DISCLAIMER,
  TEMPLATE_DISCLAIMER
} from '../lib/board';

describe('board.js pure tactical logic', () => {
  const pitch = { pitch_length_m: 90, pitch_width_m: 60 };

  describe('formationTemplates', () => {
    it('returns templates for 11v11, 9v9, 7v7, 5v5 with correct player counts', () => {
      // 11v11
      const t11 = formationTemplates('11v11', pitch);
      expect(t11['4-3-3']).toBeDefined();
      expect(t11['4-4-2']).toBeDefined();
      expect(t11['3-5-2']).toBeDefined();
      expect(t11['4-3-3'].players.length).toBe(22); // 11 own + 11 opponent
      const own11 = t11['4-3-3'].players.filter((p) => p.team === 'own');
      const opp11 = t11['4-3-3'].players.filter((p) => p.team === 'opponent');
      expect(own11.length).toBe(11);
      expect(opp11.length).toBe(11);

      // 9v9
      const t9 = formationTemplates('9v9', { pitch_length_m: 75, pitch_width_m: 50 });
      expect(t9['3-3-2']).toBeDefined();
      expect(t9['3-3-2'].players.length).toBe(18); // 9 own + 9 opp
      expect(t9['3-3-2'].players.filter((p) => p.team === 'own').length).toBe(9);
      expect(t9['3-3-2'].players.filter((p) => p.team === 'opponent').length).toBe(9);

      // 7v7
      const t7 = formationTemplates('7v7', { pitch_length_m: 60, pitch_width_m: 40 });
      expect(t7['2-3-1']).toBeDefined();
      expect(t7['2-3-1'].players.length).toBe(14); // 7 own + 7 opp
      expect(t7['2-3-1'].players.filter((p) => p.team === 'own').length).toBe(7);
      expect(t7['2-3-1'].players.filter((p) => p.team === 'opponent').length).toBe(7);

      // 5v5
      const t5 = formationTemplates('5v5', { pitch_length_m: 40, pitch_width_m: 25 });
      expect(t5['1-2-1']).toBeDefined();
      expect(t5['1-2-1'].players.length).toBe(10); // 5 own + 5 opp
      expect(t5['1-2-1'].players.filter((p) => p.team === 'own').length).toBe(5);
      expect(t5['1-2-1'].players.filter((p) => p.team === 'opponent').length).toBe(5);
    });

    it('ensures all players in templates are within pitch boundaries', () => {
      const formats = ['11v11', '9v9', '7v7', '5v5'];
      for (const fmt of formats) {
        const tmps = formationTemplates(fmt, pitch);
        for (const [name, template] of Object.entries(tmps)) {
          expect(template.ball.x).toBeGreaterThanOrEqual(0);
          expect(template.ball.x).toBeLessThanOrEqual(pitch.pitch_length_m);
          expect(template.ball.y).toBeGreaterThanOrEqual(0);
          expect(template.ball.y).toBeLessThanOrEqual(pitch.pitch_width_m);

          for (const p of template.players) {
            expect(p.x, `${fmt} ${name} player ${p.id} x`).toBeGreaterThanOrEqual(0);
            expect(p.x, `${fmt} ${name} player ${p.id} x`).toBeLessThanOrEqual(pitch.pitch_length_m);
            expect(p.y, `${fmt} ${name} player ${p.id} y`).toBeGreaterThanOrEqual(0);
            expect(p.y, `${fmt} ${name} player ${p.id} y`).toBeLessThanOrEqual(pitch.pitch_width_m);
          }
        }
      }
    });

    it('includes mandatory template disclaimer', () => {
      expect(TEMPLATE_DISCLAIMER).toBe('Template awal, bukan rekomendasi');
      expect(BOARD_DISCLAIMER).toBe('Skema ilustrasi dari pelatih, bukan hasil analisis data.');
    });
  });

  describe('clampToPitch and moveBy', () => {
    it('clamps points accurately to boundaries', () => {
      expect(clampToPitch({ x: -10, y: -5 }, pitch)).toEqual({ x: 0, y: 0 });
      expect(clampToPitch({ x: 100, y: 70 }, pitch)).toEqual({ x: 90, y: 60 });
      expect(clampToPitch({ x: 45, y: 30 }, pitch)).toEqual({ x: 45, y: 30 });
    });

    it('moves points by delta and clamps to pitch', () => {
      const start = { x: 89, y: 59 };
      const moved = moveBy(start, 5, 5, pitch);
      expect(moved).toEqual({ x: 90, y: 60 });

      const movedBack = moveBy(start, -100, -100, pitch);
      expect(movedBack).toEqual({ x: 0, y: 0 });
    });
  });

  describe('calculateEasing', () => {
    it('handles linear and easeInOut', () => {
      expect(calculateEasing(0, 'linear')).toBe(0);
      expect(calculateEasing(1, 'linear')).toBe(1);
      expect(calculateEasing(0.5, 'linear')).toBe(0.5);

      expect(calculateEasing(0, 'easeInOut')).toBe(0);
      expect(calculateEasing(1, 'easeInOut')).toBe(1);
      expect(calculateEasing(0.5, 'easeInOut')).toBe(0.5);
      expect(calculateEasing(0.2, 'easeInOut')).toBeLessThan(0.2); // ease in accelerates
      expect(calculateEasing(0.8, 'easeInOut')).toBeGreaterThan(0.8); // ease out decelerates
    });
  });

  describe('interpolateFrame', () => {
    const frameA = {
      players: [
        { id: 'p1', x: 10, y: 20, team: 'own', label: '1' },
        { id: 'p2', x: 30, y: 40, team: 'own', label: '2' },
        { id: 'p-only-a', x: 50, y: 50, team: 'own', label: '3' }
      ],
      ball: { x: 10, y: 20 },
      arrows: [{ from: { x: 10, y: 20 }, to: { x: 30, y: 40 }, kind: 'pass' }]
    };

    const frameB = {
      players: [
        { id: 'p1', x: 20, y: 20, team: 'own', label: '1' },
        { id: 'p2', x: 40, y: 50, team: 'own', label: '2' },
        { id: 'p-only-b', x: 60, y: 60, team: 'opponent', label: '4' }
      ],
      ball: { x: 30, y: 40 },
      arrows: [{ from: { x: 30, y: 40 }, to: { x: 50, y: 50 }, kind: 'run' }]
    };

    it('interpolates positions at t=0', () => {
      const interp0 = interpolateFrame(frameA, frameB, 0, 'linear');
      const p1 = interp0.players.find((p) => p.id === 'p1');
      expect(p1.x).toBe(10);
      expect(p1.y).toBe(20);
      expect(p1.opacity).toBe(1);
      expect(interp0.ball.x).toBe(10);
      expect(interp0.ball.y).toBe(20);
    });

    it('interpolates positions at t=0.5', () => {
      const interpHalf = interpolateFrame(frameA, frameB, 0.5, 'linear');
      const p1 = interpHalf.players.find((p) => p.id === 'p1');
      expect(p1.x).toBe(15);
      expect(p1.y).toBe(20);
      expect(p1.opacity).toBe(1);

      const p2 = interpHalf.players.find((p) => p.id === 'p2');
      expect(p2.x).toBe(35);
      expect(p2.y).toBe(45);

      expect(interpHalf.ball.x).toBe(20);
      expect(interpHalf.ball.y).toBe(30);

      // Player only in A fades out
      const pOnlyA = interpHalf.players.find((p) => p.id === 'p-only-a');
      expect(pOnlyA.opacity).toBe(0.5);

      // Player only in B fades in
      const pOnlyB = interpHalf.players.find((p) => p.id === 'p-only-b');
      expect(pOnlyB.opacity).toBe(0.5);
    });

    it('interpolates positions at t=1', () => {
      const interp1 = interpolateFrame(frameA, frameB, 1, 'linear');
      const p1 = interp1.players.find((p) => p.id === 'p1');
      expect(p1.x).toBe(20);
      expect(p1.y).toBe(20);
      expect(interp1.ball.x).toBe(30);
      expect(interp1.ball.y).toBe(40);
    });

    it('fades arrows across frames', () => {
      const interp = interpolateFrame(frameA, frameB, 0.3, 'linear');
      expect(interp.arrows.length).toBe(2);
      expect(interp.arrows[0].opacity).toBe(0.7); // arrow from A fading out
      expect(interp.arrows[1].opacity).toBe(0.3); // arrow from B fading in
    });
  });

  describe('validateFrame', () => {
    it('validates correct frame structure', () => {
      const frame = {
        players: [{ id: 'p1', x: 10, y: 20 }],
        ball: { x: 10, y: 20 },
        arrows: [{ from: { x: 10, y: 20 }, to: { x: 20, y: 20 }, kind: 'pass' }]
      };
      expect(validateFrame(frame, pitch)).toBe(true);
    });

    it('rejects frame with more than 24 players', () => {
      const players = Array.from({ length: 25 }, (_, i) => ({
        id: `p-${i}`,
        x: 10,
        y: 10
      }));
      expect(() => validateFrame({ players }, pitch)).toThrow('Jumlah pemain melebihi batas maksimal 24');
    });

    it('rejects duplicate player IDs in the same frame', () => {
      const players = [
        { id: 'p-dup', x: 10, y: 10 },
        { id: 'p-dup', x: 20, y: 20 }
      ];
      expect(() => validateFrame({ players }, pitch)).toThrow('ID pemain duplikat');
    });

    it('rejects player positions outside pitch or infinite', () => {
      expect(() => validateFrame({ players: [{ id: 'p1', x: 95, y: 10 }] }, pitch)).toThrow('di luar batas');
      expect(() => validateFrame({ players: [{ id: 'p1', x: NaN, y: 10 }] }, pitch)).toThrow('angka terhingga');
    });

    it('rejects more than 40 arrows or invalid arrow kind', () => {
      const arrows = Array.from({ length: 41 }, () => ({
        from: { x: 0, y: 0 },
        to: { x: 10, y: 10 },
        kind: 'pass'
      }));
      expect(() => validateFrame({ arrows }, pitch)).toThrow('Jumlah panah melebihi batas maksimal 40');

      expect(() =>
        validateFrame({
          arrows: [{ from: { x: 0, y: 0 }, to: { x: 10, y: 10 }, kind: 'invalid-kind' }]
        }, pitch)
      ).toThrow('Jenis panah "invalid-kind" tidak valid');
    });
  });
});
