PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_offers` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`offered_listing_id` text NOT NULL,
	`requested_listing_id` text,
	`requested_need_id` text,
	`image_key` text,
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
	FOREIGN KEY (`requested_need_id`) REFERENCES `needs`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "offers_distinct_parties" CHECK("__new_offers"."from_user_id" <> "__new_offers"."to_user_id"),
	CONSTRAINT "offers_distinct_listings" CHECK("__new_offers"."offered_listing_id" <> "__new_offers"."requested_listing_id"),
	CONSTRAINT "offers_single_target" CHECK(("__new_offers"."requested_listing_id" IS NULL) <> ("__new_offers"."requested_need_id" IS NULL))
);
--> statement-breakpoint
INSERT INTO `__new_offers`("id", "match_id", "from_user_id", "to_user_id", "offered_listing_id", "requested_listing_id", "requested_need_id", "image_key", "message", "status", "expires_at", "responded_at", "created_at", "updated_at") SELECT "id", "match_id", "from_user_id", "to_user_id", "offered_listing_id", "requested_listing_id", NULL, NULL, "message", "status", "expires_at", "responded_at", "created_at", "updated_at" FROM `offers`;--> statement-breakpoint
DROP TABLE `offers`;--> statement-breakpoint
ALTER TABLE `__new_offers` RENAME TO `offers`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `offers_to_user_idx` ON `offers` (`to_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `offers_from_user_idx` ON `offers` (`from_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `offers_match_idx` ON `offers` (`match_id`);