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
CREATE TABLE `assignments` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`kit_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`reading_material` text(1000000),
	`time_limit_minutes` integer,
	`start_date` integer,
	`due_at` integer,
	`pre_test_form_id` text,
	`post_test_form_id` text,
	`delayed_post_test_form_id` text,
	`tam_form_id` text,
	`delayed_post_test_delay_days` integer DEFAULT 7,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`pre_test_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`post_test_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`delayed_post_test_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tam_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `assignments_goalMapId_idx` ON `assignments` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `assignments_kitId_idx` ON `assignments` (`kit_id`);--> statement-breakpoint
CREATE INDEX `assignments_createdBy_idx` ON `assignments` (`created_by`);--> statement-breakpoint
CREATE TABLE `diagnoses` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`learner_map_id` text NOT NULL,
	`summary` text,
	`per_link` text,
	`score` real,
	`rubric_version` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`learner_map_id`) REFERENCES `learner_maps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `diagnoses_goalMapId_idx` ON `diagnoses` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `diagnoses_learnerMapId_idx` ON `diagnoses` (`learner_map_id`);--> statement-breakpoint
CREATE TABLE `experiment_groups` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`group_name` text,
	`condition` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `experiment_groups_assignmentId_idx` ON `experiment_groups` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `experiment_groups_userId_idx` ON `experiment_groups` (`user_id`);--> statement-breakpoint
CREATE TABLE `feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_map_id` text NOT NULL,
	`goal_map_id` text NOT NULL,
	`items` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`learner_map_id`) REFERENCES `learner_maps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `feedback_learnerMapId_idx` ON `feedback` (`learner_map_id`);--> statement-breakpoint
CREATE INDEX `feedback_goalMapId_idx` ON `feedback` (`goal_map_id`);--> statement-breakpoint
CREATE TABLE `form_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'locked' NOT NULL,
	`unlocked_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `form_progress_formId_idx` ON `form_progress` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_progress_userId_idx` ON `form_progress` (`user_id`);--> statement-breakpoint
CREATE TABLE `form_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`user_id` text NOT NULL,
	`answers` text NOT NULL,
	`submitted_at` integer,
	`time_spent_seconds` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `form_responses_formId_idx` ON `form_responses` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_responses_userId_idx` ON `form_responses` (`user_id`);--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'registration' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`unlock_conditions` text,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `forms_createdBy_idx` ON `forms` (`created_by`);--> statement-breakpoint
CREATE TABLE `goal_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`teacher_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`nodes` text NOT NULL,
	`edges` text NOT NULL,
	`direction` text DEFAULT 'bi' NOT NULL,
	`type` text DEFAULT 'teacher' NOT NULL,
	`text_id` text,
	`topic_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`text_id`) REFERENCES `texts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `goal_maps_teacherId_idx` ON `goal_maps` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `goal_maps_textId_idx` ON `goal_maps` (`text_id`);--> statement-breakpoint
CREATE INDEX `goal_maps_topicId_idx` ON `goal_maps` (`topic_id`);--> statement-breakpoint
CREATE TABLE `kit_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`kit_id` text NOT NULL,
	`set_id` text NOT NULL,
	`order` integer NOT NULL,
	`text_id` text,
	`instructions` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`text_id`) REFERENCES `texts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `kit_sets_kitId_idx` ON `kit_sets` (`kit_id`);--> statement-breakpoint
CREATE INDEX `kit_sets_textId_idx` ON `kit_sets` (`text_id`);--> statement-breakpoint
CREATE TABLE `kits` (
	`id` text PRIMARY KEY NOT NULL,
	`kit_id` text NOT NULL,
	`name` text NOT NULL,
	`layout` text DEFAULT 'preset' NOT NULL,
	`options` text,
	`enabled` integer DEFAULT true NOT NULL,
	`goal_map_id` text NOT NULL,
	`teacher_id` text NOT NULL,
	`text_id` text,
	`nodes` text DEFAULT '[]' NOT NULL,
	`edges` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`text_id`) REFERENCES `texts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kits_kit_id_unique` ON `kits` (`kit_id`);--> statement-breakpoint
CREATE INDEX `kits_goalMapId_idx` ON `kits` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `kits_teacherId_idx` ON `kits` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `kits_textId_idx` ON `kits` (`text_id`);--> statement-breakpoint
CREATE TABLE `learner_maps` (
	`id` text PRIMARY KEY NOT NULL,
	`assignment_id` text NOT NULL,
	`goal_map_id` text NOT NULL,
	`kit_id` text NOT NULL,
	`user_id` text NOT NULL,
	`nodes` text,
	`edges` text,
	`control_text` text(100000),
	`status` text DEFAULT 'draft' NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`submitted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `learner_maps_assignmentId_idx` ON `learner_maps` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_goalMapId_idx` ON `learner_maps` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_kitId_idx` ON `learner_maps` (`kit_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_userId_idx` ON `learner_maps` (`user_id`);--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`type` text NOT NULL,
	`question_text` text NOT NULL,
	`options` text,
	`order_index` integer NOT NULL,
	`required` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `questions_formId_idx` ON `questions` (`form_id`);--> statement-breakpoint
CREATE TABLE `texts` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text(1000000) NOT NULL,
	`metadata` text,
	`images` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
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
CREATE TABLE `cohort_members` (
	`id` text PRIMARY KEY NOT NULL,
	`cohort_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `cohort_members_cohortId_idx` ON `cohort_members` (`cohort_id`);--> statement-breakpoint
CREATE INDEX `cohort_members_userId_idx` ON `cohort_members` (`user_id`);--> statement-breakpoint
CREATE TABLE `cohorts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
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
	`age` integer,
	`jlpt_level` text,
	`japanese_learning_duration` integer,
	`previous_japanese_score` real,
	`media_consumption` real,
	`motivation` text,
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