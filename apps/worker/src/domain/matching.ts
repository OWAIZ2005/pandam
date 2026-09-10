/**
 * Deterministic, rule-based reciprocal matching for PANDAM V1.
 *
 * NO AI, embeddings, semantic search, LLMs or scoring. A match is a plain
 * structural fact:
 *
 *   user A HAS x   AND   user B NEEDS x    (same category + type)
 *   user B HAS y   AND   user A NEEDS y    (same category + type)
 *
 * The comparison key is `${categoryId}::${type}` — a stable id, never free-form
 * text ("Web Design" / "web design" collapse to one category upstream). x and y
 * may be the same key or different keys.
 *
 * This module is pure: it takes plain arrays and returns plain results, so it is
 * fully unit-testable with no database. The repository layer supplies the arrays
 * (published listings/needs) and persists the discovered candidates.
 */
import { type ItemType } from '@pandam/types';

/** A published "I HAVE" (listing) or "I NEED" (need), reduced to match inputs. */
export interface MarketItem {
  id: string;
  ownerId: string;
  categoryId: string;
  type: ItemType;
}

/** A discovered direct reciprocal barter candidate, in canonical order. */
export interface ReciprocalMatch {
  /** Lexicographically-smaller user id (canonical ordering for the pair). */
  userAId: string;
  userBId: string;
  /** A HAS this — B NEEDS it. */
  aListingId: string;
  bNeedId: string;
  /** B HAS this — A NEEDS it. */
  bListingId: string;
  aNeedId: string;
}

const compatKey = (item: Pick<MarketItem, 'categoryId' | 'type'>): string =>
  `${item.categoryId}::${item.type}`;

function groupByKey(items: MarketItem[]): Map<string, MarketItem[]> {
  const map = new Map<string, MarketItem[]>();
  for (const item of items) {
    const key = compatKey(item);
    const bucket = map.get(key);
    if (bucket) bucket.push(item);
    else map.set(key, [item]);
  }
  return map;
}

/**
 * Find every direct reciprocal match between the given published listings
 * ("I HAVE") and needs ("I NEED"). Results are deterministic: sorted and
 * de-duplicated, with each pair emitted once in `userAId < userBId` order.
 *
 * Complexity is O(H·N) in the worst case; for V1 volumes that is fine, and the
 * caller narrows the inputs by category first. A future index-based version can
 * replace this without changing the signature.
 */
export function findReciprocalMatches(
  listings: MarketItem[],
  needs: MarketItem[],
): ReciprocalMatch[] {
  const havesByKey = groupByKey(listings);
  const needsByKey = groupByKey(needs);
  const seen = new Set<string>();
  const out: ReciprocalMatch[] = [];

  for (const [key, haves] of havesByKey) {
    const wants = needsByKey.get(key);
    if (!wants) continue;

    for (const have of haves) {
      for (const want of wants) {
        if (have.ownerId === want.ownerId) continue; // can't barter with yourself

        // Direction 1 established: have.owner HAS `key`, want.owner NEEDS `key`.
        // Look for the return direction: want.owner HAS something have.owner NEEDS.
        for (const [returnKey, returnHaves] of havesByKey) {
          const returnWants = needsByKey.get(returnKey);
          if (!returnWants) continue;

          for (const returnHave of returnHaves) {
            if (returnHave.ownerId !== want.ownerId) continue;
            for (const returnWant of returnWants) {
              if (returnWant.ownerId !== have.ownerId) continue;

              const match = toCanonical({
                firstOwner: have.ownerId,
                firstListingId: have.id, // first owner HAS
                firstNeedId: returnWant.id, // first owner NEEDS
                secondOwner: want.ownerId,
                secondListingId: returnHave.id, // second owner HAS
                secondNeedId: want.id, // second owner NEEDS
              });

              const dedupeKey = [
                match.aListingId,
                match.bNeedId,
                match.bListingId,
                match.aNeedId,
              ].join('|');
              if (seen.has(dedupeKey)) continue;
              seen.add(dedupeKey);
              out.push(match);
            }
          }
        }
      }
    }
  }

  out.sort((a, b) =>
    a.userAId !== b.userAId
      ? a.userAId.localeCompare(b.userAId)
      : a.userBId !== b.userBId
        ? a.userBId.localeCompare(b.userBId)
        : a.aListingId.localeCompare(b.aListingId),
  );
  return out;
}

/** True iff at least one direct reciprocal match exists between two users' items. */
export function hasReciprocalMatch(listings: MarketItem[], needs: MarketItem[]): boolean {
  return findReciprocalMatches(listings, needs).length > 0;
}

interface UnorderedMatch {
  firstOwner: string;
  firstListingId: string;
  firstNeedId: string;
  secondOwner: string;
  secondListingId: string;
  secondNeedId: string;
}

/** Emit the match with the lexicographically-smaller user as A. */
function toCanonical(m: UnorderedMatch): ReciprocalMatch {
  if (m.firstOwner <= m.secondOwner) {
    return {
      userAId: m.firstOwner,
      userBId: m.secondOwner,
      aListingId: m.firstListingId,
      aNeedId: m.firstNeedId,
      bListingId: m.secondListingId,
      bNeedId: m.secondNeedId,
    };
  }
  return {
    userAId: m.secondOwner,
    userBId: m.firstOwner,
    aListingId: m.secondListingId,
    aNeedId: m.secondNeedId,
    bListingId: m.firstListingId,
    bNeedId: m.firstNeedId,
  };
}
