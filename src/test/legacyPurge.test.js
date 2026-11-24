import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, '../../');

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name === 'test'
      ) {
        continue;
      }
      getFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function stripComments(content) {
  // Strip HTML / SVG comments
  let result = content.replace(/<!--[\s\S]*?-->/g, '');
  // Strip JSX block comments {/* ... */}
  result = result.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  // Strip JS block comments /* ... */
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  // Strip JS single-line comments // ...
  result = result.replace(/\/\/.*$/gm, '');
  return result;
}

function toRelative(filePath) {
  return path.relative(ROOT_DIR, filePath).replace(/\\/g, '/');
}

describe('Legacy UI & Fabrication Purge Scan (B8)', () => {
  const srcFiles = getFiles(path.join(ROOT_DIR, 'src'));
  const publicFiles = getFiles(path.join(ROOT_DIR, 'public'));
  const scriptsFiles = getFiles(path.join(ROOT_DIR, 'scripts'));
  const indexHtml = path.join(ROOT_DIR, 'index.html');

  const allScannedFiles = [...srcFiles, ...publicFiles, ...scriptsFiles];
  if (fs.existsSync(indexHtml)) {
    allScannedFiles.push(indexHtml);
  }

  // 1. Assert 0 occurrences of CCFF00 (case-insensitive)
  it('asserts 0 occurrences of CCFF00 across repository', () => {
    const voltPattern = new RegExp('CC' + 'FF' + '00', 'i');
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const content = fs.readFileSync(file, 'utf8');
      if (voltPattern.test(content)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 2. Assert 0 occurrences of font-athletic
  it('asserts 0 occurrences of font-athletic', () => {
    const athleticPattern = new RegExp('font-' + 'athletic');
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const content = fs.readFileSync(file, 'utf8');
      if (athleticPattern.test(content)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 3. Assert 0 occurrences of gradient outside comments
  it('asserts 0 occurrences of gradient (outside comments)', () => {
    const gradientPattern = new RegExp('grad' + 'ient', 'i');
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const rawContent = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(rawContent);

      if (gradientPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 4. Assert 0 occurrences of shadow-2xl
  it('asserts 0 occurrences of shadow-2xl', () => {
    const shadowPattern = new RegExp('shadow-' + '2xl');
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const content = fs.readFileSync(file, 'utf8');
      if (shadowPattern.test(content)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 5. Assert 0 occurrences of FIFA (outside references)
  it('asserts 0 occurrences of FIFA outside references', () => {
    const fifaPattern = /\bFIFA\b/;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      if (rel === 'src/data/references.js') continue;

      const content = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(content);
      if (fifaPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 6. Assert 0 occurrences of VAEP outside references
  it('asserts 0 occurrences of VAEP outside references', () => {
    const vaepPattern = /\bVAEP\b/;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      if (rel === 'src/data/references.js') continue;

      const content = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(content);
      if (vaepPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 7. Assert 0 occurrences of Filanesia display strings
  it('asserts 0 occurrences of Filanesia display strings outside references', () => {
    const filanesiaPattern = /Filanesia/;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      if (rel === 'src/data/references.js') continue;

      const content = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(content);
      if (filanesiaPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 8. Assert 0 occurrences of OVR
  it('asserts 0 occurrences of OVR outside integrity', () => {
    const ovrPattern = /\bOVR\b/;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const content = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(content);
      if (ovrPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 9. Assert 0 occurrences of Rekor Baru
  it('asserts 0 occurrences of Rekor Baru', () => {
    const rekorPattern = /Rekor\s+Baru/i;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const content = fs.readFileSync(file, 'utf8');
      if (rekorPattern.test(content)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 10. Assert 0 occurrences of Top (with trailing space) outside comments
  it('asserts 0 occurrences of Top [rank] outside comments', () => {
    const topPattern = /\bTop\s+/;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      const content = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(content);
      if (topPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });

  // 11. Assert 0 occurrences of hex colors outside allowed files
  it('asserts 0 occurrences of hex colors outside allowed files', () => {
    const allowedFiles = new Set([
      'index.html',
      'public/favicon.svg',
      'public/icon.svg',
      'public/manifest.json',
      'public/brand/favicon.svg',
      'public/brand/logo-mark-light.svg',
      'public/brand/logo-mark.svg',
      'scripts/generate-png-icons.js',
      'src/index.css'
    ]);

    const hexPattern = /#[0-9a-fA-F]{3,8}\b/;
    const violations = [];

    for (const file of allScannedFiles) {
      const rel = toRelative(file);
      if (allowedFiles.has(rel)) continue;

      const content = fs.readFileSync(file, 'utf8');
      const stripped = stripComments(content);
      if (hexPattern.test(stripped)) {
        violations.push(rel);
      }
    }

    expect(violations).toEqual([]);
  });
});
