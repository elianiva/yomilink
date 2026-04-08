CREATE TABLE `assignment_experiment_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`condition` text NOT NULL,
	`created_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
	`updated_at` integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `assignment_experiment_groups_assignmentId_idx` ON `assignment_experiment_groups` (`assignment_id`);
CREATE INDEX `assignment_experiment_groups_userId_idx` ON `assignment_experiment_groups` (`user_id`);
