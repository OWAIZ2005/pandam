import { describe, expect, it } from 'vitest';

import {
  PBKDF2_ITERATIONS,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  needsRehash,
  verifyPassword,
} from '../../src/lib/crypto';

describe('password hashing', () => {
  it('produces a self-describing pbkdf2 string and never the plaintext', async () => {
    const hash = await hashPassword('correct horse 9');
    expect(hash.startsWith(`pbkdf2$sha256$${PBKDF2_ITERATIONS}$`)).toBe(true);
    expect(hash).not.toContain('correct horse 9');
    expect(hash.split('$')).toHaveLength(5);
  });

  it('verifies the right password and rejects the wrong one', async () => {
    const hash = await hashPassword('s3cret pass');
    expect(await verifyPassword('s3cret pass', hash)).toBe(true);
    expect(await verifyPassword('s3cret Pass', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('uses a random salt (two hashes of the same password differ)', async () => {
    const [a, b] = await Promise.all([hashPassword('same input 1'), hashPassword('same input 1')]);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed stored hash without throwing', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('x', 'pbkdf2$sha256$abc$def')).toBe(false);
  });

  it('needsRehash is true for a weaker or invalid work factor, false for current', async () => {
    expect(needsRehash(await hashPassword('abc12345678'))).toBe(false);
    expect(needsRehash('pbkdf2$sha256$1000$aaaa$bbbb')).toBe(true);
    expect(needsRehash('garbage')).toBe(true);
  });
});

describe('session tokens', () => {
  it('generates unguessable, url-safe tokens', () => {
    const a = generateSessionToken();
    const b = generateSessionToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(a.length).toBeGreaterThanOrEqual(40);
  });

  it('hashes tokens to stable 64-hex and different tokens do not collide', async () => {
    const t = generateSessionToken();
    const h1 = await hashSessionToken(t);
    const h2 = await hashSessionToken(t);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashSessionToken(generateSessionToken())).not.toBe(h1);
  });
});
