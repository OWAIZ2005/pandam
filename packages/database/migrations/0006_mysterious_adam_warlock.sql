ALTER TABLE `users` ADD `identity_verification_status` text DEFAULT 'not_started' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `government_id_verified_at` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `face_verified_at` integer;