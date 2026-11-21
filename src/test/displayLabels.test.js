import { describe, it, expect } from 'vitest';
import {
  formatPositionLabel,
  formatPreferredFoot,
  formatAttributeName
} from '../lib/displayLabels';
import { playersRoster } from '../data/mockData';

describe('displayLabels utility', () => {
  it('G4: maps every position present in demo data to an Indonesian label', () => {
    const demoPositions = playersRoster.map((p) => p.personal_info.position);
    expect(demoPositions.length).toBeGreaterThan(0);

    demoPositions.forEach((pos) => {
      const translated = formatPositionLabel(pos);
      expect(translated).toBeTruthy();
      expect(translated).not.toBe('Belum ada data');
      // Must map to localized Indonesian label
      expect(translated).toMatch(/Gelandang|Sayap|Penyerang|Bek|Kiper/);
    });
  });

  it('maps all preferred foot options in demo data to Indonesian', () => {
    const demoFeet = playersRoster.map((p) => p.personal_info.preferred_foot);
    demoFeet.forEach((foot) => {
      const translated = formatPreferredFoot(foot);
      expect(translated).toBeTruthy();
      expect(translated).toMatch(/Kaki kanan|Kaki kiri|Kedua kaki/);
    });
  });

  it('maps technical attribute names to Indonesian', () => {
    expect(formatAttributeName('Pace (Kecepatan)')).toBe('Kecepatan');
    expect(formatAttributeName('Shooting (Finishing)')).toBe('Tembakan');
    expect(formatAttributeName('Passing (Distribusi)')).toBe('Operan');
    expect(formatAttributeName('Dribbling (Kontrol)')).toBe('Menggiring');
    expect(formatAttributeName('Defending (Pressing)')).toBe('Bertahan');
    expect(formatAttributeName('Physical (Daya Tahan)')).toBe('Fisik');
  });

  it('passes unknown values through unchanged', () => {
    expect(formatPositionLabel('Sweeper Keeper')).toBe('Sweeper Keeper');
    expect(formatPreferredFoot('Unknown Foot')).toBe('Unknown Foot');
    expect(formatAttributeName('Agility')).toBe('Agility');
  });

  it('returns "Belum ada data" for null or empty input', () => {
    expect(formatPositionLabel(null)).toBe('Belum ada data');
    expect(formatPositionLabel('')).toBe('Belum ada data');
    expect(formatPreferredFoot(null)).toBe('Belum ada data');
    expect(formatPreferredFoot('')).toBe('Belum ada data');
    expect(formatAttributeName(null)).toBe('');
  });
});
