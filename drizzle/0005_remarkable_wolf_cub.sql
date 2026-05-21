DROP TABLE `assignment_experiment_groups`;--> statement-breakpoint
DROP TABLE `kit_sets`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_assignments` (
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
	`deleted_at` integer,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`pre_test_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`post_test_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`delayed_post_test_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`tam_form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_assignments`("id", "goal_map_id", "kit_id", "title", "description", "reading_material", "time_limit_minutes", "start_date", "due_at", "pre_test_form_id", "post_test_form_id", "delayed_post_test_form_id", "tam_form_id", "delayed_post_test_delay_days", "created_by", "created_at", "updated_at", "deleted_at") SELECT "id", "goal_map_id", "kit_id", "title", "description", "reading_material", "time_limit_minutes", "start_date", "due_at", "pre_test_form_id", "post_test_form_id", "delayed_post_test_form_id", "tam_form_id", "delayed_post_test_delay_days", "created_by", "created_at", "updated_at", "deleted_at" FROM `assignments`;--> statement-breakpoint
DROP TABLE `assignments`;--> statement-breakpoint
ALTER TABLE `__new_assignments` RENAME TO `assignments`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `assignments_goalMapId_idx` ON `assignments` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `assignments_kitId_idx` ON `assignments` (`kit_id`);--> statement-breakpoint
CREATE INDEX `assignments_createdBy_idx` ON `assignments` (`created_by`);--> statement-breakpoint
CREATE TABLE `__new_diagnoses` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_map_id` text NOT NULL,
	`learner_map_id` text NOT NULL,
	`summary` text,
	`per_link` text,
	`score` real,
	`rubric_version` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`learner_map_id`) REFERENCES `learner_maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_diagnoses`("id", "goal_map_id", "learner_map_id", "summary", "per_link", "score", "rubric_version", "created_at", "updated_at", "deleted_at") SELECT "id", "goal_map_id", "learner_map_id", "summary", "per_link", "score", "rubric_version", "created_at", "updated_at", "deleted_at" FROM `diagnoses`;--> statement-breakpoint
DROP TABLE `diagnoses`;--> statement-breakpoint
ALTER TABLE `__new_diagnoses` RENAME TO `diagnoses`;--> statement-breakpoint
CREATE INDEX `diagnoses_goalMapId_idx` ON `diagnoses` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `diagnoses_learnerMapId_idx` ON `diagnoses` (`learner_map_id`);--> statement-breakpoint
CREATE TABLE `__new_feedback` (
	`id` text PRIMARY KEY NOT NULL,
	`learner_map_id` text NOT NULL,
	`goal_map_id` text NOT NULL,
	`items` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`learner_map_id`) REFERENCES `learner_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_feedback`("id", "learner_map_id", "goal_map_id", "items", "visibility", "created_by", "created_at", "updated_at", "deleted_at") SELECT "id", "learner_map_id", "goal_map_id", "items", "visibility", "created_by", "created_at", "updated_at", "deleted_at" FROM `feedback`;--> statement-breakpoint
DROP TABLE `feedback`;--> statement-breakpoint
ALTER TABLE `__new_feedback` RENAME TO `feedback`;--> statement-breakpoint
CREATE INDEX `feedback_learnerMapId_idx` ON `feedback` (`learner_map_id`);--> statement-breakpoint
CREATE INDEX `feedback_goalMapId_idx` ON `feedback` (`goal_map_id`);--> statement-breakpoint
CREATE TABLE `__new_form_progress` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`user_id` text NOT NULL,
	`status` text DEFAULT 'locked' NOT NULL,
	`unlocked_at` integer,
	`completed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_form_progress`("id", "form_id", "user_id", "status", "unlocked_at", "completed_at", "created_at", "updated_at", "deleted_at") SELECT "id", "form_id", "user_id", "status", "unlocked_at", "completed_at", "created_at", "updated_at", "deleted_at" FROM `form_progress`;--> statement-breakpoint
DROP TABLE `form_progress`;--> statement-breakpoint
ALTER TABLE `__new_form_progress` RENAME TO `form_progress`;--> statement-breakpoint
CREATE INDEX `form_progress_formId_idx` ON `form_progress` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_progress_userId_idx` ON `form_progress` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_form_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`form_id` text NOT NULL,
	`user_id` text NOT NULL,
	`answers` text NOT NULL,
	`submitted_at` integer,
	`time_spent_seconds` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`form_id`) REFERENCES `forms`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_form_responses`("id", "form_id", "user_id", "answers", "submitted_at", "time_spent_seconds", "created_at", "updated_at", "deleted_at") SELECT "id", "form_id", "user_id", "answers", "submitted_at", "time_spent_seconds", "created_at", "updated_at", "deleted_at" FROM `form_responses`;--> statement-breakpoint
DROP TABLE `form_responses`;--> statement-breakpoint
ALTER TABLE `__new_form_responses` RENAME TO `form_responses`;--> statement-breakpoint
CREATE INDEX `form_responses_formId_idx` ON `form_responses` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_responses_userId_idx` ON `form_responses` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `form_responses_form_user_unique` ON `form_responses` (`form_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `__new_goal_maps` (
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
	`deleted_at` integer,
	FOREIGN KEY (`text_id`) REFERENCES `texts`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_goal_maps`("id", "teacher_id", "title", "description", "nodes", "edges", "direction", "type", "text_id", "topic_id", "created_at", "updated_at", "deleted_at") SELECT "id", "teacher_id", "title", "description", "nodes", "edges", "direction", "type", "text_id", "topic_id", "created_at", "updated_at", "deleted_at" FROM `goal_maps`;--> statement-breakpoint
DROP TABLE `goal_maps`;--> statement-breakpoint
ALTER TABLE `__new_goal_maps` RENAME TO `goal_maps`;--> statement-breakpoint
CREATE INDEX `goal_maps_teacherId_idx` ON `goal_maps` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `goal_maps_textId_idx` ON `goal_maps` (`text_id`);--> statement-breakpoint
CREATE INDEX `goal_maps_topicId_idx` ON `goal_maps` (`topic_id`);--> statement-breakpoint
CREATE TABLE `__new_kits` (
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
	`deleted_at` integer,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`text_id`) REFERENCES `texts`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_kits`("id", "kit_id", "name", "layout", "options", "enabled", "goal_map_id", "teacher_id", "text_id", "nodes", "edges", "created_at", "updated_at", "deleted_at") SELECT "id", "kit_id", "name", "layout", "options", "enabled", "goal_map_id", "teacher_id", "text_id", "nodes", "edges", "created_at", "updated_at", "deleted_at" FROM `kits`;--> statement-breakpoint
DROP TABLE `kits`;--> statement-breakpoint
ALTER TABLE `__new_kits` RENAME TO `kits`;--> statement-breakpoint
CREATE UNIQUE INDEX `kits_kit_id_unique` ON `kits` (`kit_id`);--> statement-breakpoint
CREATE INDEX `kits_goalMapId_idx` ON `kits` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `kits_teacherId_idx` ON `kits` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `kits_textId_idx` ON `kits` (`text_id`);--> statement-breakpoint
CREATE TABLE `__new_learner_maps` (
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
	`deleted_at` integer,
	FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`goal_map_id`) REFERENCES `goal_maps`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`kit_id`) REFERENCES `kits`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_learner_maps`("id", "assignment_id", "goal_map_id", "kit_id", "user_id", "nodes", "edges", "control_text", "status", "attempt", "submitted_at", "created_at", "updated_at", "deleted_at") SELECT "id", "assignment_id", "goal_map_id", "kit_id", "user_id", "nodes", "edges", "control_text", "status", "attempt", "submitted_at", "created_at", "updated_at", "deleted_at" FROM `learner_maps`;--> statement-breakpoint
DROP TABLE `learner_maps`;--> statement-breakpoint
ALTER TABLE `__new_learner_maps` RENAME TO `learner_maps`;--> statement-breakpoint
CREATE INDEX `learner_maps_assignmentId_idx` ON `learner_maps` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_goalMapId_idx` ON `learner_maps` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_kitId_idx` ON `learner_maps` (`kit_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_userId_idx` ON `learner_maps` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `learner_maps_assignment_user_attempt_unique` ON `learner_maps` (`assignment_id`,`user_id`,`attempt`);