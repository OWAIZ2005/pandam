/**
 * Canonical enum value tuples for the PANDAM domain — the single source of
 * truth for every `status` / `type` union.
 *
 * This module imports NOTHING (no Drizzle, no Cloudflare) so it can be consumed
 * by `@pandam/validation` and the Expo app without pulling the database driver
 * into the client bundle. The schema files (`./schema/*`) import their `enum:`
 * options from here; nothing defines these tuples twice.
 */

export const USER_STATUS = ['active', 'suspended', 'deleted'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

export const CATEGORY_STATUS = ['active', 'inactive'] as const;
export type CategoryStatus = (typeof CATEGORY_STATUS)[number];

/** What is offered ("I HAVE") or wanted ("I NEED"). */
export const ITEM_TYPE = ['product', 'service', 'skill'] as const;
export type ItemType = (typeof ITEM_TYPE)[number];

/** Publication lifecycle shared by listings and needs. Only `published` matches. */
export const PUBLICATION_STATUS = ['draft', 'published', 'paused', 'archived'] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUS)[number];

export const MATCH_STATUS = ['candidate', 'dismissed'] as const;
export type MatchStatus = (typeof MATCH_STATUS)[number];

export const OFFER_STATUS = ['pending', 'accepted', 'rejected', 'cancelled', 'expired'] as const;
export type OfferStatus = (typeof OFFER_STATUS)[number];

export const CONVERSATION_STATUS = ['active', 'archived'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUS)[number];

export const CONVERSATION_ROLE = ['member'] as const;
export type ConversationRole = (typeof CONVERSATION_ROLE)[number];

export const BARTER_TRANSACTION_STATUS = [
  'created',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
] as const;
export type BarterTransactionStatus = (typeof BARTER_TRANSACTION_STATUS)[number];

export const NOTIFICATION_TYPE = [
  'offer_received',
  'offer_accepted',
  'offer_rejected',
  'offer_cancelled',
  'offer_expired',
  'message_received',
  'transaction_updated',
  'review_reminder',
  'review_received',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

export const REPORT_SUBJECT_TYPE = ['user', 'listing', 'need', 'message', 'transaction'] as const;
export type ReportSubjectType = (typeof REPORT_SUBJECT_TYPE)[number];

export const REPORT_REASON = ['spam', 'harassment', 'scam', 'inappropriate', 'other'] as const;
export type ReportReason = (typeof REPORT_REASON)[number];

export const REPORT_STATUS = ['open', 'reviewing', 'resolved', 'dismissed'] as const;
export type ReportStatus = (typeof REPORT_STATUS)[number];

export const DISPUTE_STATUS = ['open', 'reviewing', 'resolved', 'rejected'] as const;
export type DisputeStatus = (typeof DISPUTE_STATUS)[number];
