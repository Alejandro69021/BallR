import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('B4: OVR & composite rating removal scan', () => {
  const FORBIDDEN_PATTERNS = [
    { name: 'OVR', regex: /\bOVR\b/ },
    { name: 'overall_rating', regex: /overall_rating/ },
    { name: 'ovr_rating', regex: /ovr_rating/ },
    { name: 'calculateOvr', regex: /calculateOvr/ },
    { name: 'getBadgeTierStyle', regex: /getBadgeTierStyle/ }
  ];

  function getAllFiles(dir, fileList = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Exclude test and docs directories
        if (entry.name === 'test' || entry.name === 'tests' || entry.name === '__tests__' || entry.name === 'docs') {
          continue;
        }
        getAllFiles(fullPath, fileList);
      } else if (entry.isFile()) {
        // Exclude test files and doc files
        if (
          !entry.name.endsWith('.test.js') &&
          !entry.name.endsWith('.test.jsx') &&
          !entry.name.endsWith('.spec.js') &&
          !entry.name.endsWith('.spec.jsx') &&
          !entry.name.endsWith('.md')
        ) {
          fileList.push(fullPath);
        }
      }
    }
    return fileList;
  }

  it('ensures no OVR, overall_rating, ovr_rating, calculateOvr, or getBadgeTierStyle exist in src/ outside integrity.js', () => {
    const srcDir = path.resolve(__dirname, '..');
    const allFiles = getAllFiles(srcDir);
    const violations = [];

    for (const file of allFiles) {
      const normalizedPath = file.split(path.sep).join('/');
      // Allow legacy v1 support in src/lib/integrity.js only
      if (normalizedPath.endsWith('src/lib/integrity.js')) {
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const { name, regex } of FORBIDDEN_PATTERNS) {
          if (regex.test(line)) {
            violations.push({
              file: normalizedPath,
              line: index + 1,
              pattern: name,
              text: line.trim()
            });
          }
        }
      });
    }

    expect(
      violations,
      `Found forbidden OVR remnants in src/:\n${violations.map((v) => `${v.file}:${v.line} (${v.pattern}) -> ${v.text}`).join('\n')}`
    ).toEqual([]);
  });
});
