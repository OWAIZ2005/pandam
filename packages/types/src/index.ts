/**
 * @pandam/types — shared types used by both the Expo app and the Worker.
 *
 * Domain entity types are DERIVED from the Drizzle schema in `@pandam/database`
 * (single source of truth) and re-exported here under clean names, so app and
 * Worker never import the database package directly and never drift on shape.
 * The import targets `@pandam/database/schema` — the schema barrel only, never
 * the D1 client — so this package needs no Cloudflare/Node type deps.
 *
 * Timestamp convention: every `createdAt` / `updatedAt` / `*At` field is epoch
 * **milliseconds** (`number`), end to end — DB, domain, and JSON API. No
 * date-string conversion layer.
 */
import type {
  BarterTransactionRow,
  BarterTransactionStatus,
  CategoryRow,
  CategoryStatus,
  ConversationParticipantRow,
  ConversationRow,
  ConversationStatus,
  DisputeRow,
  DisputeStatus,
  ItemType,
  ListingImageRow,
  ListingRow,
  MatchRow,
  MatchStatus,
  MessageRow,
  NeedRow,
  NotificationRow,
  NotificationType,
  OfferRow,
  OfferStatus,
  ProfileRow,
  PublicationStatus,
  ReportReason,
  ReportRow,
  ReportStatus,
  ReportSubjectType,
  ReviewRow,
  UserRow,
  UserStatus,
} from '@pandam/database/schema';

/* -------------------------------------------------------------------------- */
/* Identifiers                                                                 */
/* -------------------------------------------------------------------------- */

/** ISO-8601 timestamp string (rarely needed — timestamps are epoch ms). */
export type IsoDateString = string;

/** Nominal id brand — prevents passing a UserId where a ListingId is expected. */
export type Id<TBrand extends string> = string & { readonly __brand: TBrand };

export type UserId = Id<'user'>;
export type ProfileId = Id<'profile'>;
export type CategoryId = Id<'category'>;
export type ListingId = Id<'listing'>;
export type ListingImageId = Id<'listingImage'>;
export type NeedId = Id<'need'>;
export type MatchId = Id<'match'>;
export type OfferId = Id<'offer'>;
export type ConversationId = Id<'conversation'>;
export type MessageId = Id<'message'>;
export type BarterTransactionId = Id<'barterTransaction'>;
export type ReviewId = Id<'review'>;
export type NotificationId = Id<'notification'>;
export type ReportId = Id<'report'>;
export type DisputeId = Id<'dispute'>;

/* -------------------------------------------------------------------------- */
/* Domain entities (derived from the DB schema)                                */
/* -------------------------------------------------------------------------- */

export type User = UserRow;
export type Profile = ProfileRow;
export type Category = CategoryRow;
export type Listing = ListingRow;
export type ListingImage = ListingImageRow;
export type Need = NeedRow;
export type Match = MatchRow;
export type Offer = OfferRow;
export type Conversation = ConversationRow;
export type ConversationParticipant = ConversationParticipantRow;
export type Message = MessageRow;
export type BarterTransaction = BarterTransactionRow;
export type Review = ReviewRow;
export type Notification = NotificationRow;
export type Report = ReportRow;
export type Dispute = DisputeRow;

/* -------------------------------------------------------------------------- */
/* Enum unions (derived from the DB schema)                                    */
/* -------------------------------------------------------------------------- */

export type {
  BarterTransactionStatus,
  CategoryStatus,
  ConversationStatus,
  DisputeStatus,
  ItemType,
  MatchStatus,
  NotificationType,
  OfferStatus,
  PublicationStatus,
  ReportReason,
  ReportStatus,
  ReportSubjectType,
  UserStatus,
};

/* -------------------------------------------------------------------------- */
/* API envelopes                                                              */
/* -------------------------------------------------------------------------- */

export interface ApiOk<TData> {
  ok: true;
  data: TData;
}

export interface ApiErr {
  ok: false;
  error: {
    code: string;
    message: string;
    /** Optional field-level details, e.g. from Zod validation. */
    details?: Record<string, string[]>;
  };
}

export type ApiResponse<TData> = ApiOk<TData> | ApiErr;

/** Cursor-paginated list result. */
export interface Paginated<TItem> {
  items: TItem[];
  nextCursor: string | null;
}

export type Platform = 'ios' | 'android' | 'web';
export type Environment = 'development' | 'preview' | 'production';
