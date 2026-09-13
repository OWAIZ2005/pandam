CREATE TABLE `payments` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`buyer_id` text NOT NULL,
	`seller_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text DEFAULT 'INR' NOT NULL,
	`status` text DEFAULT 'created' NOT NULL,
	`razorpay_payment_link_id` text NOT NULL,
	`razorpay_short_url` text NOT NULL,
	`razorpay_payment_id` text,
	`webhook_verified_at` integer,
	`expires_at` integer,
	`paid_at` integer,
	`cancelled_at` integer,
	`refunded_at` integer,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`buyer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`seller_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "payments_amount_positive" CHECK("payments"."amount" > 0),
	CONSTRAINT "payments_distinct_parties" CHECK("payments"."buyer_id" <> "payments"."seller_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payments_link_unique` ON `payments` (`razorpay_payment_link_id`);--> statement-breakpoint
CREATE INDEX `payments_buyer_idx` ON `payments` (`buyer_id`,`status`);--> statement-breakpoint
CREATE INDEX `payments_seller_idx` ON `payments` (`seller_id`,`status`);--> statement-breakpoint
CREATE INDEX `payments_listing_idx` ON `payments` (`listing_id`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_listings` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`category_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`transaction_type` text DEFAULT 'barter' NOT NULL,
	`price_amount` integer,
	`price_currency` text DEFAULT 'INR' NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "listings_price_required_for_sale" CHECK("__new_listings"."transaction_type" = 'barter' OR "__new_listings"."price_amount" IS NOT NULL),
	CONSTRAINT "listings_price_positive" CHECK("__new_listings"."price_amount" IS NULL OR "__new_listings"."price_amount" > 0)
);
--> statement-breakpoint
INSERT INTO `__new_listings`("id", "owner_id", "category_id", "type", "title", "description", "status", "transaction_type", "price_amount", "price_currency", "created_at", "updated_at") SELECT "id", "owner_id", "category_id", "type", "title", "description", "status", 'barter', NULL, 'INR', "created_at", "updated_at" FROM `listings`;--> statement-breakpoint
DROP TABLE `listings`;--> statement-breakpoint
ALTER TABLE `__new_listings` RENAME TO `listings`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `listings_owner_idx` ON `listings` (`owner_id`);--> statement-breakpoint
CREATE INDEX `listings_category_idx` ON `listings` (`category_id`);--> statement-breakpoint
CREATE INDEX `listings_match_idx` ON `listings` (`status`,`category_id`,`type`);--> statement-breakpoint
CREATE INDEX `listings_transaction_type_idx` ON `listings` (`status`,`transaction_type`);