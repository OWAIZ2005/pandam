import { describe, expect, it } from 'vitest';

import {
  findReciprocalMatches,
  hasReciprocalMatch,
  type MarketItem,
} from '../../src/domain/matching';

/** Build a MarketItem tersely. `cat` is a category id, `type` an item type. */
const item = (
  id: string,
  ownerId: string,
  cat: string,
  type: MarketItem['type'] = 'service',
): MarketItem => ({ id, ownerId, categoryId: cat, type });

describe('findReciprocalMatches', () => {
  it('finds a direct reciprocal match (A has photography+needs web, B has web+needs photography)', () => {
    const listings = [item('lst_a', 'usr_a', 'cat_photography'), item('lst_b', 'usr_b', 'cat_web')];
    const needs = [item('ned_a', 'usr_a', 'cat_web'), item('ned_b', 'usr_b', 'cat_photography')];

    const matches = findReciprocalMatches(listings, needs);

    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      userAId: 'usr_a',
      userBId: 'usr_b',
      aListingId: 'lst_a',
      bNeedId: 'ned_b',
      bListingId: 'lst_b',
      aNeedId: 'ned_a',
    });
    expect(hasReciprocalMatch(listings, needs)).toBe(true);
  });

  it('returns nothing when the second leg is missing (B needs gardening, not photography)', () => {
    const listings = [item('lst_a', 'usr_a', 'cat_photography'), item('lst_b', 'usr_b', 'cat_web')];
    const needs = [item('ned_a', 'usr_a', 'cat_web'), item('ned_b', 'usr_b', 'cat_gardening')];

    expect(findReciprocalMatches(listings, needs)).toEqual([]);
    expect(hasReciprocalMatch(listings, needs)).toBe(false);
  });

  it('requires the item type to match, not only the category', () => {
    // Everyone is in category x, but the HAVE/NEED types never line up:
    // both users HAVE product/x and both NEED service/x -> nobody needs what
    // anyone has, so there is no first leg and no match.
    const listings = [
      item('lst_a', 'usr_a', 'cat_x', 'product'),
      item('lst_b', 'usr_b', 'cat_x', 'product'),
    ];
    const needs = [
      item('ned_a', 'usr_a', 'cat_x', 'service'),
      item('ned_b', 'usr_b', 'cat_x', 'service'),
    ];
    expect(findReciprocalMatches(listings, needs)).toEqual([]);
  });

  it('matches when types differ per leg but each leg aligns (product-for-service)', () => {
    const listings = [
      item('lst_a', 'usr_a', 'cat_x', 'product'),
      item('lst_b', 'usr_b', 'cat_x', 'service'),
    ];
    const needs = [
      item('ned_a', 'usr_a', 'cat_x', 'service'),
      item('ned_b', 'usr_b', 'cat_x', 'product'),
    ];
    const matches = findReciprocalMatches(listings, needs);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ userAId: 'usr_a', userBId: 'usr_b', aListingId: 'lst_a' });
  });

  it('never matches a user with themselves', () => {
    const listings = [item('lst_1', 'usr_solo', 'cat_a'), item('lst_2', 'usr_solo', 'cat_b')];
    const needs = [item('ned_1', 'usr_solo', 'cat_b'), item('ned_2', 'usr_solo', 'cat_a')];
    expect(findReciprocalMatches(listings, needs)).toEqual([]);
  });

  it('supports same-category reciprocal (both trade within web design)', () => {
    const listings = [item('lst_a', 'usr_b', 'cat_web'), item('lst_b', 'usr_a', 'cat_web')];
    const needs = [item('ned_a', 'usr_b', 'cat_web'), item('ned_b', 'usr_a', 'cat_web')];
    const matches = findReciprocalMatches(listings, needs);
    expect(matches).toHaveLength(1);
    expect(matches[0]?.userAId).toBe('usr_a');
    expect(matches[0]?.userBId).toBe('usr_b');
  });

  it('is deterministic and canonical regardless of input order', () => {
    const listings = [item('lst_b', 'usr_b', 'cat_web'), item('lst_a', 'usr_a', 'cat_photography')];
    const needs = [item('ned_b', 'usr_b', 'cat_photography'), item('ned_a', 'usr_a', 'cat_web')];
    const forwards = findReciprocalMatches(listings, needs);
    const backwards = findReciprocalMatches([...listings].reverse(), [...needs].reverse());
    expect(forwards).toEqual(backwards);
    expect(forwards[0]?.userAId).toBe('usr_a'); // lexicographically smaller
  });

  it('finds multiple independent matches', () => {
    const listings = [
      item('lst_a', 'usr_a', 'cat_photo'),
      item('lst_b', 'usr_b', 'cat_web'),
      item('lst_c', 'usr_c', 'cat_music'),
      item('lst_d', 'usr_d', 'cat_food'),
    ];
    const needs = [
      item('ned_a', 'usr_a', 'cat_web'),
      item('ned_b', 'usr_b', 'cat_photo'),
      item('ned_c', 'usr_c', 'cat_food'),
      item('ned_d', 'usr_d', 'cat_music'),
    ];
    const matches = findReciprocalMatches(listings, needs);
    expect(matches).toHaveLength(2);
    expect(matches.map((m) => `${m.userAId}/${m.userBId}`)).toEqual(['usr_a/usr_b', 'usr_c/usr_d']);
  });
});
