import {
  createListingSchema,
  createNeedSchema,
  createOfferSchema,
  createReviewSchema,
  loginSchema,
  patchProfileSchema,
  registerSchema,
  respondToOfferSchema,
} from '@pandam/validation';
import { describe, expect, it } from 'vitest';

const catId = `cat_${'a'.repeat(32)}`;
const usrId = `usr_${'b'.repeat(32)}`;
const lstId = `lst_${'c'.repeat(32)}`;
const lstId2 = `lst_${'d'.repeat(32)}`;
const btxId = `btx_${'e'.repeat(32)}`;

describe('createListingSchema', () => {
  it('accepts a well-formed listing', () => {
    const parsed = createListingSchema.parse({
      categoryId: catId,
      type: 'service',
      title: 'Logo design',
      description: 'I will design a clean vector logo for your project.',
    });
    expect(parsed.type).toBe('service');
  });

  it('rejects an unknown type', () => {
    const r = createListingSchema.safeParse({
      categoryId: catId,
      type: 'barter',
      title: 'x',
      description: 'y',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a too-short title and a malformed category id', () => {
    const r = createListingSchema.safeParse({
      categoryId: 'nope',
      type: 'skill',
      title: 'ab',
      description: 'short',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const fields = r.error.issues.map((i) => i.path.join('.'));
      expect(fields).toEqual(expect.arrayContaining(['categoryId', 'title', 'description']));
    }
  });
});

describe('createNeedSchema', () => {
  it('mirrors the listing rules', () => {
    const r = createNeedSchema.safeParse({
      categoryId: catId,
      type: 'product',
      title: 'Standing desk',
      description: 'Looking for a height-adjustable standing desk in good condition.',
    });
    expect(r.success).toBe(true);
  });
});

describe('createOfferSchema', () => {
  it('accepts a valid offer and rejects a bad target id', () => {
    expect(
      createOfferSchema.safeParse({
        toUserId: usrId,
        offeredListingId: lstId,
        requestedListingId: lstId2,
      }).success,
    ).toBe(true);

    expect(
      createOfferSchema.safeParse({
        toUserId: 'usr_short',
        offeredListingId: lstId,
        requestedListingId: lstId2,
      }).success,
    ).toBe(false);
  });
});

describe('respondToOfferSchema', () => {
  it('only allows accept/reject/cancel', () => {
    expect(respondToOfferSchema.safeParse({ action: 'accept' }).success).toBe(true);
    expect(respondToOfferSchema.safeParse({ action: 'explode' }).success).toBe(false);
  });
});

describe('createReviewSchema', () => {
  it('bounds the rating to 1..5', () => {
    expect(createReviewSchema.safeParse({ transactionId: btxId, rating: 5 }).success).toBe(true);
    expect(createReviewSchema.safeParse({ transactionId: btxId, rating: 0 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ transactionId: btxId, rating: 6 }).success).toBe(false);
    expect(createReviewSchema.safeParse({ transactionId: btxId, rating: 3.5 }).success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('normalises the email and accepts a strong password', () => {
    const r = registerSchema.parse({
      email: '  Alice@Example.COM ',
      password: 'a decent pw 7',
      displayName: 'Alice',
      username: 'Alice_01',
    });
    expect(r.email).toBe('alice@example.com');
    expect(r.username).toBe('alice_01');
  });

  it('rejects a short password and one with no digit', () => {
    expect(
      registerSchema.safeParse({ email: 'a@b.co', password: 'short1', displayName: 'A' }).success,
    ).toBe(false);
    const noDigit = registerSchema.safeParse({
      email: 'a@b.co',
      password: 'all letters here',
      displayName: 'A',
    });
    expect(noDigit.success).toBe(false);
    if (!noDigit.success)
      expect(JSON.stringify(noDigit.error.issues)).not.toContain('all letters here');
  });

  it('rejects a bad username', () => {
    expect(
      registerSchema.safeParse({
        email: 'a@b.co',
        password: 'good pass 12',
        displayName: 'A',
        username: 'no spaces!',
      }).success,
    ).toBe(false);
  });
});

describe('loginSchema', () => {
  it('accepts any non-empty password (no strength policy on login)', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: '' }).success).toBe(false);
  });
});

describe('patchProfileSchema', () => {
  it('requires at least one field', () => {
    expect(patchProfileSchema.safeParse({}).success).toBe(false);
    expect(patchProfileSchema.safeParse({ bio: 'hi' }).success).toBe(true);
  });
});
