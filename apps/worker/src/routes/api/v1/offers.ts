/**
 * `/api/v1/offers` — barter proposals between two users: "I give you my HAVE
 * for your HAVE". No money anywhere in this file — see `payments.ts` for that.
 *
 *   POST /             propose a trade (auth)
 *   GET  /incoming     offers sent TO the caller (auth)
 *   GET  /outgoing     offers the caller SENT (auth)
 *   GET  /:id          one offer (a party to it only)
 *   POST /:id/respond  accept / reject (recipient) / cancel (sender)
 *
 * Accepting an offer atomically creates the `barter_transactions` row and the
 * negotiation `conversation` — both exist the instant a trade is agreed, so
 * the client never has to orchestrate that itself.
 */
import { type ItemRef, type OfferView } from '@pandam/types';
import { createOfferSchema, respondToOfferSchema } from '@pandam/validation';
import { type Context, Hono } from 'hono';

import { offerTransition } from '../../../domain/offers';
import { ApiError, sendOk } from '../../../lib/http';
import { toOwnerRef } from '../../../lib/serialize';
import { parseBody } from '../../../lib/validate';
import { authMiddleware, getAuth, requireAuth } from '../../../middleware/auth';
import { notify } from '../../../services/notify';
import { type AppEnv } from '../../../types';

export const offersRoute = new Hono<AppEnv>();

offersRoute.post('/', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const input = await parseBody(c, createOfferSchema);

  if (input.toUserId === user.id) {
    throw new ApiError('unprocessable', 'You cannot send an offer to yourself.');
  }

  const [offered, requested] = await Promise.all([
    repos.listings.findById(input.offeredListingId),
    repos.listings.findById(input.requestedListingId),
  ]);
  if (!offered || offered.status !== 'published' || offered.ownerId !== user.id) {
    throw new ApiError('unprocessable', 'You can only offer your own published listing.');
  }
  if (!requested || requested.status !== 'published' || requested.ownerId !== input.toUserId) {
    throw new ApiError('unprocessable', "That's not a published listing of the recipient's.");
  }
  if (offered.transactionType === 'sale' || requested.transactionType === 'sale') {
    throw new ApiError('unprocessable', 'A sale-only listing cannot be part of a barter offer.');
  }
  // `matchId` is not cross-checked against a persisted `matches` row: the
  // deterministic matches this app shows today are computed on the fly (see
  // `routes/api/v1/matches.ts`) and never written to that table, so there is
  // no real `mch_…` id to validate against yet. The column and the FK exist
  // for when that changes; today the app never sends this field.

  const created = await repos.offers.create({
    matchId: input.matchId ?? null,
    fromUserId: user.id,
    toUserId: input.toUserId,
    offeredListingId: input.offeredListingId,
    requestedListingId: input.requestedListingId,
    message: input.message ?? null,
    expiresAt: input.expiresAt ?? null,
  });

  await notify(c, {
    userId: input.toUserId,
    type: 'offer_received',
    data: { offerId: created.id },
  });

  return sendOk(c, { offer: await hydrate(c, created, user.id) }, 201);
});

offersRoute.get('/incoming', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const status = parseStatusFilter(c);
  const rows = await repos.offers.listIncoming(user.id, status);
  return sendOk(c, { items: await Promise.all(rows.map((o) => hydrate(c, o, user.id))) });
});

offersRoute.get('/outgoing', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const status = parseStatusFilter(c);
  const rows = await repos.offers.listOutgoing(user.id, status);
  return sendOk(c, { items: await Promise.all(rows.map((o) => hydrate(c, o, user.id))) });
});

offersRoute.get('/:id', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const offer = await repos.offers.findById(c.req.param('id'));
  if (!offer || (offer.fromUserId !== user.id && offer.toUserId !== user.id)) {
    throw new ApiError('not_found', 'That offer does not exist.');
  }
  return sendOk(c, { offer: await hydrate(c, offer, user.id) });
});

offersRoute.post('/:id/respond', authMiddleware, requireAuth, async (c) => {
  const { user } = getAuth(c);
  const { repos } = c.get('ctx');
  const offer = await repos.offers.findById(c.req.param('id'));
  if (!offer || (offer.fromUserId !== user.id && offer.toUserId !== user.id)) {
    throw new ApiError('not_found', 'That offer does not exist.');
  }
  const { action } = await parseBody(c, respondToOfferSchema);

  if (action === 'cancel' && offer.fromUserId !== user.id) {
    throw new ApiError('forbidden', 'Only the sender can cancel an offer.');
  }
  if ((action === 'accept' || action === 'reject') && offer.toUserId !== user.id) {
    throw new ApiError('forbidden', 'Only the recipient can respond to an offer.');
  }

  const transition = offerTransition(offer.status, action);
  if (!transition.ok) {
    throw new ApiError('unprocessable', transition.error.message);
  }
  await repos.offers.applyStatus(offer.id, transition.next);

  if (action === 'accept') {
    const transaction = await repos.barterTransactions.create({
      offerId: offer.id,
      initiatedByUserId: offer.fromUserId,
      counterpartyUserId: offer.toUserId,
    });
    const conversation = await repos.conversations.create({
      offerId: offer.id,
      participantUserIds: [offer.fromUserId, offer.toUserId],
    });
    await Promise.all([
      // Both listings realised the trade — they're no longer on the market.
      repos.listings.setStatus(offer.offeredListingId, 'archived'),
      repos.listings.setStatus(offer.requestedListingId, 'archived'),
      notify(c, {
        userId: offer.fromUserId,
        type: 'offer_accepted',
        data: { offerId: offer.id, transactionId: transaction.id, conversationId: conversation.id },
      }),
    ]);
  } else {
    await notify(c, {
      userId: offer.fromUserId,
      type: action === 'reject' ? 'offer_rejected' : 'offer_cancelled',
      data: { offerId: offer.id },
    });
  }

  const updated = await repos.offers.findById(offer.id);
  return sendOk(c, { offer: await hydrate(c, updated!, user.id) });
});

function parseStatusFilter(c: Context<AppEnv>) {
  const raw = c.req.query('status');
  const allowed = ['pending', 'accepted', 'rejected', 'cancelled', 'expired'] as const;
  return allowed.includes(raw as (typeof allowed)[number])
    ? (raw as (typeof allowed)[number])
    : undefined;
}

async function hydrate(
  c: Context<AppEnv>,
  offer: {
    id: string;
    status: string;
    fromUserId: string;
    toUserId: string;
    offeredListingId: string;
    requestedListingId: string;
    message: string | null;
    matchId: string | null;
    expiresAt: number | null;
    respondedAt: number | null;
    createdAt: number;
    updatedAt: number;
  },
  meId: string,
): Promise<OfferView> {
  const { repos } = c.get('ctx');
  const [fromProfile, toProfile, offeredListing, requestedListing] = await Promise.all([
    repos.profiles.findByUserId(offer.fromUserId),
    repos.profiles.findByUserId(offer.toUserId),
    repos.market.getListing(offer.offeredListingId),
    repos.market.getListing(offer.requestedListingId),
  ]);

  const toItemRef = (
    id: string,
    item: {
      title: string;
      type: string;
      category: { id: string; name: string; slug: string };
    } | null,
  ): ItemRef => ({
    id,
    title: item?.title ?? 'Listing removed',
    type: (item?.type ?? 'product') as ItemRef['type'],
    category: item?.category ?? { id: '', name: 'Unknown', slug: 'unknown' },
  });

  return {
    id: offer.id,
    status: offer.status as OfferView['status'],
    isMine: offer.fromUserId === meId,
    fromUser: toOwnerRef(offer.fromUserId, fromProfile),
    toUser: toOwnerRef(offer.toUserId, toProfile),
    offered: toItemRef(offer.offeredListingId, offeredListing),
    requested: toItemRef(offer.requestedListingId, requestedListing),
    message: offer.message,
    matchId: offer.matchId,
    expiresAt: offer.expiresAt,
    respondedAt: offer.respondedAt,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
  };
}
