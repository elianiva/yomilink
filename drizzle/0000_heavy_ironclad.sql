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
