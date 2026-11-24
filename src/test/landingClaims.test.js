import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { landingCopy } from '../components/landing/landingCopy';

/**
 * Claims Guard (docs/LANDING_SPEC.md Bagian 2)
 * Memastikan tidak ada klaim palsu, istilah terlarang, atau hiperbola pemasaran
 * pada salinan teks dan komponen landing page publik.
 */

export const FORBIDDEN_CLAIM_RULES = [
  {
    name: 'testimoni',
    pattern: /\btestimoni\b/i
  },
  {
    name: 'logo klub',
    pattern: /\blogo\s+klub\b/i
  },
  {
    name: 'ribuan',
    pattern: /\bribuan\b/i
  },
  {
    name: 'terbukti',
    pattern: /\bterbukti\b/i
  },
  {
    name: 'terbaik (hanya diizinkan pada "label pemain terbaik dan terburuk")',
    pattern: /\bterbaik\b/i,
    sanitizer: (text) => text.replace(/label pemain terbaik dan terburuk/gi, '')
  },
  {
    name: 'nomor 1',
    pattern: /\b(?:nomor|no\.?)\s*1\b/i
  },
  {
    name: 'terakreditasi',
    pattern: /\bterakreditasi\b/i
  },
  {
    name: 'resmi',
    pattern: /\bresmi\b/i
  },
  {
    name: 'klaim biaya atau teknis terlarang (biaya apa pun, gratis, U-19, algoritma otomatis, backend)',
    pattern: /\b(?:biaya\s+apa\s+pun|gratis|U-19|algoritma\s+otomatis|backend)\b/i
  },
  {
    name: 'bersertifikat',
    pattern: /\bbersertifikat\b/i
  },
  {
    name: 'AI',
    pattern: /\bAI\b/
  },
  {
    name: 'kecerdasan buatan',
    pattern: /\bkecerdasan\s+buatan\b/i
  },
  {
    name: 'scouting',
    pattern: /\bscouting\b/i
  },
  {
    name: 'prediksi bakat',
    pattern: /\bprediksi\s+bakat\b/i
  },
  {
    name: 'OVR',
    pattern: /\bOVR\b/
  },
  {
    name: 'rating bintang',
    pattern: /\brating\s+bintang\b|\bbintang\s+[1-5]\b/i
  },
  {
    name: 'harga/Rp',
    pattern: /\bharga\b|\bRp\s*\d+/i,
    sanitizer: (text) => text.replace(/belum ada harga/gi, '')
  },
  {
    name: '100%',
    pattern: /100\s*%/
  },
  {
    name: 'sesuai UU PDP (hanya boleh "memperhatikan prinsip UU PDP")',
    pattern: /\b(?:sesuai|patuh|kepatuhan)\s+(?:dengan\s+|pada\s+)?UU\s+PDP\b/i
  },
  {
    name: 'digit diikuti % atau + (kecuali "n ≥ 10" dan "6×3")',
    pattern: /\d+\s*[%+]/
  }
];

export function validateLandingText(rawText) {
  const violations = [];

  for (const rule of FORBIDDEN_CLAIM_RULES) {
    let textToTest = rawText;
    if (rule.sanitizer) {
      textToTest = rule.sanitizer(rawText);
    }

    if (rule.pattern.test(textToTest)) {
      violations.push(rule.name);
    }
  }

  return violations;
}

function collectStrings(obj, collector = []) {
  if (!obj) return collector;
  if (typeof obj === 'string') {
    collector.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach((item) => collectStrings(item, collector));
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach((val) => collectStrings(val, collector));
  }
  return collector;
}

describe('Landing Claims Guard (docs/LANDING_SPEC.md bagian 2 & 9)', () => {
  it('asserts landingCopy object contains no forbidden terms', () => {
    const allStrings = collectStrings(landingCopy);
    const combinedText = allStrings.join(' \n ');

    const violations = validateLandingText(combinedText);
    expect(violations, `Ditemukan klaim terlarang di landingCopy: ${violations.join(', ')}`).toEqual([]);
  });

  it('scans all source files under src/components/landing/ and src/pages/LandingPage.jsx', () => {
    const landingDir = path.resolve(__dirname, '../components/landing');
    const landingPagePath = path.resolve(__dirname, '../pages/LandingPage.jsx');

    const files = fs
      .readdirSync(landingDir)
      .filter((f) => f.endsWith('.jsx') || f.endsWith('.js'))
      .map((f) => path.join(landingDir, f));

    files.push(landingPagePath);

    const fileViolations = [];

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, lineIndex) => {
        // Skip comment lines in file header
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

        const v = validateLandingText(line);
        if (v.length > 0) {
          fileViolations.push({
            file: path.relative(path.resolve(__dirname, '..'), filePath),
            line: lineIndex + 1,
            text: trimmed,
            violations: v
          });
        }
      });
    }

    expect(fileViolations, `Ditemukan pelanggaran klaim di berkas komponen landing:\n${JSON.stringify(fileViolations, null, 2)}`).toEqual([]);
  });

  it('asserts the three status lists exist in status columns', () => {
    const columns = landingCopy?.status?.columns;
    expect(columns, 'Status columns must exist').toBeDefined();
    expect(columns.length).toBe(3);

    const titles = columns.map((c) => c.title);
    expect(titles).toContain('Ada hari ini');
    expect(titles).toContain('Sedang disiapkan');
    expect(titles).toContain('Belum ada');

    for (const col of columns) {
      expect(Array.isArray(col.items)).toBe(true);
      expect(col.items.length).toBeGreaterThan(0);
    }
  });

  it('asserts "Belum ada" contains video-upload and automatic-video-analysis items', () => {
    const belumAdaCol = landingCopy.status.columns.find((c) => c.title === 'Belum ada');
    expect(belumAdaCol).toBeDefined();

    const itemsText = belumAdaCol.items.join(' ; ');
    expect(itemsText).toMatch(/unggah\s+video/i);
    expect(itemsText).toMatch(/analisis\s+video\s+otomatis/i);
  });

  it('proves the guard actually fails on bad strings', () => {
    // 1. AI & terbaik
    const bad1 = 'Platform sepak bola terbaik dengan teknologi AI canggih';
    expect(validateLandingText(bad1)).toEqual(
      expect.arrayContaining([
        'terbaik (hanya diizinkan pada "label pemain terbaik dan terburuk")',
        'AI'
      ])
    );

    // 2. Exception test: "label pemain terbaik dan terburuk" is allowed
    const allowedPhrase = 'Menampilkan rubrik deskriptif tanpa label pemain terbaik dan terburuk.';
    expect(validateLandingText(allowedPhrase)).not.toContain(
      'terbaik (hanya diizinkan pada "label pemain terbaik dan terburuk")'
    );

    // 3. 100% and digit + %
    const bad2 = 'Jaminan akurasi 100% untuk atlet';
    expect(validateLandingText(bad2)).toEqual(
      expect.arrayContaining(['100%', 'digit diikuti % atau + (kecuali "n ≥ 10" dan "6×3")'])
    );

    // 4. Digit + "+"
    const bad3 = 'Lebih dari 500+ laga tercatat';
    expect(validateLandingText(bad3)).toEqual(
      expect.arrayContaining(['digit diikuti % atau + (kecuali "n ≥ 10" dan "6×3")'])
    );

    // 5. Bare resmi & scouting & nomor 1
    const bad4 = 'Aplikasi resmi untuk scouting atlet nomor 1 di Indonesia';
    expect(validateLandingText(bad4)).toEqual(
      expect.arrayContaining([
        'resmi',
        'scouting',
        'nomor 1'
      ])
    );

    const badResmiAlone = 'Dokumen ini adalah data resmi akademi';
    expect(validateLandingText(badResmiAlone)).toContain('resmi');

    // 6. Forbidden cost, age, and tech claims
    const badCostAndTech = 'Aplikasi ini gratis tanpa biaya apa pun untuk U-19 menggunakan algoritma otomatis di backend kami';
    expect(validateLandingText(badCostAndTech)).toContain(
      'klaim biaya atau teknis terlarang (biaya apa pun, gratis, U-19, algoritma otomatis, backend)'
    );

    // 7. Sesuai UU PDP (disallowed) vs memperhatikan prinsip UU PDP (allowed)
    const bad5 = 'Sistem ini sudah sesuai UU PDP';
    expect(validateLandingText(bad5)).toContain(
      'sesuai UU PDP (hanya boleh "memperhatikan prinsip UU PDP")'
    );

    const goodUUPDP = 'Sistem dirancang dengan memperhatikan prinsip UU PDP';
    expect(validateLandingText(goodUUPDP)).not.toContain(
      'sesuai UU PDP (hanya boleh "memperhatikan prinsip UU PDP")'
    );

    // 7. OVR, harga, ribuan, terbukti, terakreditasi, bersertifikat
    const bad6 = 'Harga Rp 50000 untuk ribuan pemain terbukti bersertifikat dengan skor OVR terakreditasi';
    const violations6 = validateLandingText(bad6);
    expect(violations6).toEqual(
      expect.arrayContaining([
        'harga/Rp',
        'ribuan',
        'terbukti',
        'bersertifikat',
        'OVR',
        'terakreditasi'
      ])
    );

    const allowedHarga = 'Belum ada harga untuk saat ini.';
    expect(validateLandingText(allowedHarga)).not.toContain('harga/Rp');
  });
});
