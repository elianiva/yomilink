CREATE TABLE `assignment_experiment_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`condition` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assignment_experiment_groups_assignmentId_idx` ON `assignment_experiment_groups` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `assignment_experiment_groups_userId_idx` ON `assignment_experiment_groups` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `assignment_experiment_groups_assignment_user_unique` ON `assignment_experiment_groups` (`assignment_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `whitelist_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`student_id` text NOT NULL,
	`name` text NOT NULL,
	`cohort_id` text,
	`claimed_user_id` text,
	`claimed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`claimed_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whitelist_entries_student_id_unique` ON `whitelist_entries` (`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `whitelist_entries_claimed_user_id_unique` ON `whitelist_entries` (`claimed_user_id`);--> statement-breakpoint
CREATE INDEX `whitelist_entries_claimedUserId_idx` ON `whitelist_entries` (`claimed_user_id`);--> statement-breakpoint
ALTER TABLE `forms` ADD `reading_material_sections` text;