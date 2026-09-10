CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (lower("email"));--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`display_name` text NOT NULL,
	`username` text,
	`bio` text,
	`avatar_key` text,
	`location_city` text,
	`location_region` text,
	`location_country` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_unique` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_username_unique` ON `profiles` (lower("username"));--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_slug_unique` ON `categories` (`slug`);--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`category_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `listings_owner_idx` ON `listings` (`owner_id`);--> statement-breakpoint
CREATE INDEX `listings_category_idx` ON `listings` (`category_id`);--> statement-breakpoint
CREATE INDEX `listings_match_idx` ON `listings` (`status`,`category_id`,`type`);--> statement-breakpoint
CREATE TABLE `listing_images` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`object_key` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `listing_images_listing_idx` ON `listing_images` (`listing_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `needs` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`category_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `needs_owner_idx` ON `needs` (`owner_id`);--> statement-breakpoint
CREATE INDEX `needs_category_idx` ON `needs` (`category_id`);--> statement-breakpoint
CREATE INDEX `needs_match_idx` ON `needs` (`status`,`category_id`,`type`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`user_a_id` text NOT NULL,
	`user_b_id` text NOT NULL,
	`a_listing_id` text NOT NULL,
	`b_need_id` text NOT NULL,
	`b_listing_id` text NOT NULL,
	`a_need_id` text NOT NULL,
	`status` text DEFAULT 'candidate' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_a_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_b_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`a_listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`b_need_id`) REFERENCES `needs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`b_listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`a_need_id`) REFERENCES `needs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_items_unique` ON `matches` (`a_listing_id`,`b_need_id`,`b_listing_id`,`a_need_id`);--> statement-breakpoint
CREATE INDEX `matches_user_a_idx` ON `matches` (`user_a_id`,`status`);--> statement-breakpoint
CREATE INDEX `matches_user_b_idx` ON `matches` (`user_b_id`,`status`);--> statement-breakpoint
CREATE TABLE `offers` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`offered_listing_id` text NOT NULL,
	`requested_listing_id` text NOT NULL,
	`message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`expires_at` integer,
	`responded_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`offered_listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "offers_distinct_parties" CHECK("offers"."from_user_id" <> "offers"."to_user_id"),
	CONSTRAINT "offers_distinct_listings" CHECK("offers"."offered_listing_id" <> "offers"."requested_listing_id")
);
--> statement-breakpoint
CREATE INDEX `offers_to_user_idx` ON `offers` (`to_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `offers_from_user_idx` ON `offers` (`from_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `offers_match_idx` ON `offers` (`match_id`);--> statement-breakpoint
CREATE TABLE `conversation_participants` (
	`conversation_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`last_read_at` integer,
	PRIMARY KEY(`conversation_id`, `user_id`),
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `conversation_participants_user_idx` ON `conversation_participants` (`user_id`);--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `conversations_offer_unique` ON `conversations` (`offer_id`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`conversation_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`edited_at` integer,
	`deleted_at` integer,
	FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_conversation_idx` ON `messages` (`conversation_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `barter_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`offer_id` text NOT NULL,
	`initiated_by_user_id` text NOT NULL,
	`counterparty_user_id` text NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`completed_at` integer,
	`cancelled_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`offer_id`) REFERENCES `offers`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`initiated_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`counterparty_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "barter_transactions_distinct_parties" CHECK("barter_transactions"."initiated_by_user_id" <> "barter_transactions"."counterparty_user_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `barter_transactions_offer_unique` ON `barter_transactions` (`offer_id`);--> statement-breakpoint
CREATE INDEX `barter_transactions_initiator_idx` ON `barter_transactions` (`initiated_by_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `barter_transactions_counterparty_idx` ON `barter_transactions` (`counterparty_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`reviewer_id` text NOT NULL,
	`reviewee_id` text NOT NULL,
	`rating` integer NOT NULL,
	`comment` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `barter_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewee_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "reviews_rating_range" CHECK("reviews"."rating" >= 1 AND "reviews"."rating" <= 5),
	CONSTRAINT "reviews_distinct_parties" CHECK("reviews"."reviewer_id" <> "reviews"."reviewee_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_txn_reviewer_unique` ON `reviews` (`transaction_id`,`reviewer_id`);--> statement-breakpoint
CREATE INDEX `reviews_reviewee_idx` ON `reviews` (`reviewee_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`data` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `notifications_user_unread_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`subject_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reports_subject_idx` ON `reports` (`subject_type`,`subject_id`);--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `reports_reporter_idx` ON `reports` (`reporter_id`);--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`raised_by_user_id` text NOT NULL,
	`reason` text NOT NULL,
	`details` text,
	`status` text DEFAULT 'open' NOT NULL,
	`resolution_note` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `barter_transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`raised_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `disputes_transaction_idx` ON `disputes` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `disputes_status_idx` ON `disputes` (`status`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new__meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new__meta`("key", "value", "updated_at") SELECT "key", "value", "updated_at" FROM `_meta`;--> statement-breakpoint
DROP TABLE `_meta`;--> statement-breakpoint
ALTER TABLE `__new__meta` RENAME TO `_meta`;--> statement-breakpoint
PRAGMA foreign_keys=ON;