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
  CredentialRow,
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
  SessionRow,
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
export type CredentialId = Id<'credential'>;
export type SessionId = Id<'session'>;
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
export type Credential = CredentialRow;
export type Session = SessionRow;
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

/* -------------------------------------------------------------------------- */
/* Authentication (API-safe shapes — no hashes, no tokens)                     */
/* -------------------------------------------------------------------------- */

/** The subset of a user the API is allowed to return. Never includes secrets. */
export interface SafeUser {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
}

/** A user's public profile as returned by the API. */
export type PublicProfile = Pick<
  Profile,
  | 'displayName'
  | 'username'
  | 'bio'
  | 'avatarKey'
  | 'locationCity'
  | 'locationRegion'
  | 'locationCountry'
  | 'createdAt'
  | 'updatedAt'
>;

/** `GET /api/v1/auth/me` payload. */
export interface AuthenticatedUser {
  user: SafeUser;
  profile: PublicProfile | null;
}

/** `POST /api/v1/auth/{register,login}` payload. `token` is for native clients;
 *  web relies on the HttpOnly cookie and can ignore it. */
export interface AuthSession {
  user: SafeUser;
  profile: PublicProfile | null;
  token: string;
  /** Epoch ms when the session expires. */
  expiresAt: number;
}
