import {
  createListingSchema,
  createNeedSchema,
  createOfferSchema,
  createReviewSchema,
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
