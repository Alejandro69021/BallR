import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Repo-Wide Integrity & Fabrication Scan (B7)', () => {
  function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (file !== 'test' && file !== '__tests__') {
          results = results.concat(walkDir(fullPath));
        }
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(fullPath);
      }
    });
    return results;
  }

  const srcDir = path.resolve(__dirname, '..');
  const allFiles = walkDir(srcDir);

  const forbiddenRules = [
    { name: 'getUserMedia (camera access)', regex: /getUserMedia/i },
    { name: 'Top [0-9]+% (fabricated ranking)', regex: /Top\s+[0-9]+%/i },
    { name: 'Rekor Baru (fabricated award)', regex: /Rekor\s+Baru/i },
    { name: 'Nasional U-13 (fabricated benchmark)', regex: /Nasional\s+U-13/i },
    { name: 'Math.random (simulated numbers)', regex: /Math\.random/ }
  ];

  // Allowlist for non-displayed IDs only (each entry requires explicit comment)
  const allowedMathRandomFiles = new Set([
    // None needed: zero Math.random in entire application codebase
  ]);

  forbiddenRules.forEach(({ name, regex }) => {
    it(`verifies no application code contains ${name}`, () => {
      const violations = [];

      allFiles.forEach((file) => {
        const relativePath = path.relative(srcDir, file).replace(/\\/g, '/');
        if (name.includes('Math.random') && allowedMathRandomFiles.has(relativePath)) {
          return;
        }

        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (regex.test(line)) {
            violations.push(`${relativePath}:${idx + 1} -> ${line.trim()}`);
          }
        });
      });

      expect(
        violations,
        `Found forbidden fabricated measurement/ranking tokens in:\n${violations.join('\n')}`
      ).toEqual([]);
    });
  });
});
