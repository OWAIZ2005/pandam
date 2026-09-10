/**
 * The PANDAM data-access layer.
 *
 * `createRepositories(db)` returns one object with every entity repository,
 * already bound to a `Database` instance. The Worker builds this once per
 * request from `env.DB` and passes it to domain services / route handlers.
 * Repositories are thin and rule-free — business rules live in
 * `apps/worker/src/domain`.
 */
import { type Database } from '../client';

import { barterTransactionsRepository } from './barter-transactions';
import { categoriesRepository } from './categories';
import { conversationsRepository } from './conversations';
import { credentialsRepository } from './credentials';
import { disputesRepository } from './disputes';
import { listingImagesRepository } from './listing-images';
import { listingsRepository } from './listings';
import { marketRepository } from './market';
import { matchesRepository } from './matches';
import { messagesRepository } from './messages';
import { needsRepository } from './needs';
import { notificationsRepository } from './notifications';
import { offersRepository } from './offers';
import { profilesRepository } from './profiles';
import { reportsRepository } from './reports';
import { reviewsRepository } from './reviews';
import { sessionsRepository } from './sessions';
import { usersRepository } from './users';

export function createRepositories(db: Database) {
  return {
    users: usersRepository(db),
    credentials: credentialsRepository(db),
    sessions: sessionsRepository(db),
    profiles: profilesRepository(db),
    categories: categoriesRepository(db),
    listings: listingsRepository(db),
    listingImages: listingImagesRepository(db),
    needs: needsRepository(db),
    market: marketRepository(db),
    matches: matchesRepository(db),
    offers: offersRepository(db),
    conversations: conversationsRepository(db),
    messages: messagesRepository(db),
    barterTransactions: barterTransactionsRepository(db),
    reviews: reviewsRepository(db),
    notifications: notificationsRepository(db),
    reports: reportsRepository(db),
    disputes: disputesRepository(db),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

export * from './helpers';
export type { CreateUserInput } from './users';
export type { CreateSessionInput } from './sessions';
export type { CreateProfileInput, UpdateProfileInput } from './profiles';
export type { CreateListingInput, UpdateListingInput } from './listings';
export type { CreateNeedInput, UpdateNeedInput } from './needs';
export type {
  ListingWithRefs,
  NeedWithRefs,
  OwnerRef,
  CategoryRef,
  DiscoverFilters,
} from './market';
export type { CreateOfferInput } from './offers';
export type { UpsertMatchInput } from './matches';
export type { CreateBarterTransactionInput } from './barter-transactions';
export type { CreateReviewInput } from './reviews';
export type { CreateConversationInput } from './conversations';
export type { CreateMessageInput } from './messages';
export type { CreateNotificationInput } from './notifications';
export type { CreateReportInput } from './reports';
export type { CreateDisputeInput } from './disputes';
export type { AddListingImageInput } from './listing-images';
