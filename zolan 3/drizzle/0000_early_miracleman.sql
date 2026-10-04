CREATE TABLE `access` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`version` text NOT NULL,
	`attribution` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`email` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`consent` integer NOT NULL,
	`consent_version` text NOT NULL,
	`page_version` text NOT NULL,
	`source` text NOT NULL,
	`attribution` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
