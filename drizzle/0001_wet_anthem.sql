CREATE TABLE `assignment_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`cohort_id` text,
	`user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `assignment_targets_assignmentId_idx` ON `assignment_targets` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `assignment_targets_cohortId_idx` ON `assignment_targets` (`cohort_id`);--> statement-breakpoint
CREATE INDEX `assignment_targets_userId_idx` ON `assignment_targets` (`user_id`);--> statement-breakpoint
ALTER TABLE `learner_maps` ADD `assignment_id` text NOT NULL REFERENCES assignments(id);--> statement-breakpoint
CREATE INDEX `learner_maps_assignmentId_idx` ON `learner_maps` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `assignments_createdBy_idx` ON `assignments` (`created_by`);