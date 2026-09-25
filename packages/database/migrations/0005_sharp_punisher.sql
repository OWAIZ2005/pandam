CREATE TABLE `oauth_identities` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`email` text,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_identities_provider_subject_unique` ON `oauth_identities` (`provider`,`provider_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_identities_user_provider_unique` ON `oauth_identities` (`user_id`,`provider`);