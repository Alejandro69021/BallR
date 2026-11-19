import { describe, it, expect } from 'vitest';
import {
  canonicalizeJson,
  computeSha256,
  buildPassportSnapshotPayload,
  generatePassportHash,
  verifyPassportHash
} from '../lib/integrity';

describe('Integrity & Canonicalization Engine', () => {
  it('canonicalizes JSON deterministically regardless of key order', () => {
    const objA = {
      b: 2,
      a: 1,
      nested: {
        z: 'last',
        m: 'middle',
        a: 'first'
      }
    };

    const objB = {
      nested: {
        a: 'first',
        z: 'last',
        m: 'middle'
      },
      a: 1,
      b: 2
    };

    const strA = canonicalizeJson(objA);
    const strB = canonicalizeJson(objB);

    expect(strA).toBe(strB);
    expect(strA).toBe('{"a":1,"b":2,"nested":{"a":"first","m":"middle","z":"last"}}');
  });

  it('normalizes numbers and formats arrays deterministically', () => {
    const obj = {
      list: [3, 1, 2],
      floatVal: 44.5000,
      intVal: 10
    };

    const str = canonicalizeJson(obj);
    expect(str).toBe('{"floatVal":44.5,"intVal":10,"list":[3,1,2]}');
  });

  it('computes valid SHA-256 hash matching known vector', async () => {
    // SHA-256 of empty string is e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    const emptyHash = await computeSha256('');
    expect(emptyHash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');

    // SHA-256 of "ProspekBola"
    const textHash = await computeSha256('ProspekBola');
    expect(textHash).toHaveLength(64);
  });

  it('generates identical hash for identical payload across runs', async () => {
    const payload1 = buildPassportSnapshotPayload(
      { public_id: 'WK-2026-0042', ovr_rating: 81 },
      { period_month: 'Oktober 2026', coach_name: 'Coach Hendro', pace: 80, shooting: 78 },
      { vertical_jump_cm: 44.5, sprint_20m_sec: 3.42 },
      { name: 'Mataram Putra FA', city: 'Yogyakarta' }
    );

    const payload2 = buildPassportSnapshotPayload(
      { public_id: 'WK-2026-0042', ovr_rating: 81 },
      { period_month: 'Oktober 2026', coach_name: 'Coach Hendro', pace: 80, shooting: 78 },
      { vertical_jump_cm: 44.5, sprint_20m_sec: 3.42 },
      { name: 'Mataram Putra FA', city: 'Yogyakarta' }
    );

    const res1 = await generatePassportHash(payload1);
    const res2 = await generatePassportHash(payload2);

    expect(res1.hash).toBe(res2.hash);
    expect(res1.canonicalString).toBe(res2.canonicalString);
  });

  it('generates a completely different hash when a single metric is altered', async () => {
    const basePayload = buildPassportSnapshotPayload(
      { public_id: 'WK-2026-0042', ovr_rating: 81 },
      { period_month: 'Oktober 2026', coach_name: 'Coach Hendro', pace: 80, shooting: 78 },
      { vertical_jump_cm: 44.5, sprint_20m_sec: 3.42 },
      { name: 'Mataram Putra FA', city: 'Yogyakarta' }
    );

    const tamperedPayload = {
      ...basePayload,
      attributes: {
        ...basePayload.attributes,
        pace: 81 // Altered by 1 point!
      }
    };

    const resOriginal = await generatePassportHash(basePayload);
    const resTampered = await generatePassportHash(tamperedPayload);

    expect(resOriginal.hash).not.toBe(resTampered.hash);
  });

  it('verifies untampered payload and detects tampered payload correctly', async () => {
    const payload = buildPassportSnapshotPayload(
      { public_id: 'WK-2026-0042', ovr_rating: 81 },
      { period_month: 'Oktober 2026', coach_name: 'Coach Hendro' },
      { vertical_jump_cm: 45.0 },
      { name: 'Mataram Putra FA' }
    );

    const { hash } = await generatePassportHash(payload);

    const isValid = await verifyPassportHash(payload, hash);
    expect(isValid).toBe(true);

    const isTampered = await verifyPassportHash({ ...payload, ovr_rating: 99 }, hash);
    expect(isTampered).toBe(false);

    const isInvalidHash = await verifyPassportHash(payload, 'deadbeef1234');
    expect(isInvalidHash).toBe(false);
  });
});
