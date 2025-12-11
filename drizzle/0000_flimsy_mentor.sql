CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`kit_id` text NOT NULL,
	`title` text NOT NULL,
	`due_at` integer,
	`cohort_id` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`learner_map_id` text NOT NULL,
	`summary` text(1000000) NOT NULL,
	`per_link` text(1000000) NOT NULL,
	`score` real NOT NULL,
	`rubric_version` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event` text NOT NULL,
	`payload` text(1000000),
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_map_id` text NOT NULL,
	`goal_map_id` text NOT NULL,
	`items` text(1000000) NOT NULL,
	`visibility` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `goal_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`nodes` text(1000000) NOT NULL,
	`edges` text(1000000) NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `goal_maps_goal_map_id_unique` ON `goal_maps` (`goal_map_id`);--> statement-breakpoint
CREATE TABLE `group_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`aggregation` text(1000000) NOT NULL,
	`cohort_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `kits` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`created_by` text NOT NULL,
	`nodes` text(1000000) NOT NULL,
	`edges` text(1000000) NOT NULL,
	`constraints` text,
	`version` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learner_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`kit_id` text NOT NULL,
	`user_id` text NOT NULL,
	`nodes` text(1000000) NOT NULL,
	`edges` text(1000000) NOT NULL,
	`status` text NOT NULL,
	`attempt` integer,
	`started_at` integer,
	`submitted_at` integer,
	`diagnosis_id` text
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`impersonated_by` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`role` text,
	`banned` integer DEFAULT false,
	`ban_reason` text,
	`ban_expires` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);