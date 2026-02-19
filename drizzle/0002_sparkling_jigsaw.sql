DROP INDEX "assignment_targets_assignmentId_idx";--> statement-breakpoint
DROP INDEX "assignment_targets_cohortId_idx";--> statement-breakpoint
DROP INDEX "assignment_targets_userId_idx";--> statement-breakpoint
DROP INDEX "assignments_goalMapId_idx";--> statement-breakpoint
DROP INDEX "assignments_kitId_idx";--> statement-breakpoint
DROP INDEX "assignments_createdBy_idx";--> statement-breakpoint
DROP INDEX "diagnoses_goalMapId_idx";--> statement-breakpoint
DROP INDEX "diagnoses_learnerMapId_idx";--> statement-breakpoint
DROP INDEX "feedback_learnerMapId_idx";--> statement-breakpoint
DROP INDEX "feedback_goalMapId_idx";--> statement-breakpoint
DROP INDEX "form_progress_formId_idx";--> statement-breakpoint
DROP INDEX "form_progress_userId_idx";--> statement-breakpoint
DROP INDEX "form_responses_formId_idx";--> statement-breakpoint
DROP INDEX "form_responses_userId_idx";--> statement-breakpoint
DROP INDEX "forms_createdBy_idx";--> statement-breakpoint
DROP INDEX "goal_maps_teacherId_idx";--> statement-breakpoint
DROP INDEX "goal_maps_textId_idx";--> statement-breakpoint
DROP INDEX "goal_maps_topicId_idx";--> statement-breakpoint
DROP INDEX "kit_sets_kitId_idx";--> statement-breakpoint
DROP INDEX "kit_sets_textId_idx";--> statement-breakpoint
DROP INDEX "kits_kit_id_unique";--> statement-breakpoint
DROP INDEX "kits_goalMapId_idx";--> statement-breakpoint
DROP INDEX "kits_teacherId_idx";--> statement-breakpoint
DROP INDEX "kits_textId_idx";--> statement-breakpoint
DROP INDEX "learner_maps_assignmentId_idx";--> statement-breakpoint
DROP INDEX "learner_maps_goalMapId_idx";--> statement-breakpoint
DROP INDEX "learner_maps_kitId_idx";--> statement-breakpoint
DROP INDEX "learner_maps_userId_idx";--> statement-breakpoint
DROP INDEX "questions_formId_idx";--> statement-breakpoint
DROP INDEX "account_userId_idx";--> statement-breakpoint
DROP INDEX "cohort_members_cohortId_idx";--> statement-breakpoint
DROP INDEX "cohort_members_userId_idx";--> statement-breakpoint
DROP INDEX "session_token_unique";--> statement-breakpoint
DROP INDEX "session_userId_idx";--> statement-breakpoint
DROP INDEX "user_email_unique";--> statement-breakpoint
DROP INDEX "verification_identifier_idx";--> statement-breakpoint
ALTER TABLE `learner_maps` ALTER COLUMN "nodes" TO "nodes" text;--> statement-breakpoint
CREATE INDEX `assignment_targets_assignmentId_idx` ON `assignment_targets` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `assignment_targets_cohortId_idx` ON `assignment_targets` (`cohort_id`);--> statement-breakpoint
CREATE INDEX `assignment_targets_userId_idx` ON `assignment_targets` (`user_id`);--> statement-breakpoint
CREATE INDEX `assignments_goalMapId_idx` ON `assignments` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `assignments_kitId_idx` ON `assignments` (`kit_id`);--> statement-breakpoint
CREATE INDEX `assignments_createdBy_idx` ON `assignments` (`created_by`);--> statement-breakpoint
CREATE INDEX `diagnoses_goalMapId_idx` ON `diagnoses` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `diagnoses_learnerMapId_idx` ON `diagnoses` (`learner_map_id`);--> statement-breakpoint
CREATE INDEX `feedback_learnerMapId_idx` ON `feedback` (`learner_map_id`);--> statement-breakpoint
CREATE INDEX `feedback_goalMapId_idx` ON `feedback` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `form_progress_formId_idx` ON `form_progress` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_progress_userId_idx` ON `form_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `form_responses_formId_idx` ON `form_responses` (`form_id`);--> statement-breakpoint
CREATE INDEX `form_responses_userId_idx` ON `form_responses` (`user_id`);--> statement-breakpoint
CREATE INDEX `forms_createdBy_idx` ON `forms` (`created_by`);--> statement-breakpoint
CREATE INDEX `goal_maps_teacherId_idx` ON `goal_maps` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `goal_maps_textId_idx` ON `goal_maps` (`text_id`);--> statement-breakpoint
CREATE INDEX `goal_maps_topicId_idx` ON `goal_maps` (`topic_id`);--> statement-breakpoint
CREATE INDEX `kit_sets_kitId_idx` ON `kit_sets` (`kit_id`);--> statement-breakpoint
CREATE INDEX `kit_sets_textId_idx` ON `kit_sets` (`text_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `kits_kit_id_unique` ON `kits` (`kit_id`);--> statement-breakpoint
CREATE INDEX `kits_goalMapId_idx` ON `kits` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `kits_teacherId_idx` ON `kits` (`teacher_id`);--> statement-breakpoint
CREATE INDEX `kits_textId_idx` ON `kits` (`text_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_assignmentId_idx` ON `learner_maps` (`assignment_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_goalMapId_idx` ON `learner_maps` (`goal_map_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_kitId_idx` ON `learner_maps` (`kit_id`);--> statement-breakpoint
CREATE INDEX `learner_maps_userId_idx` ON `learner_maps` (`user_id`);--> statement-breakpoint
CREATE INDEX `questions_formId_idx` ON `questions` (`form_id`);--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `cohort_members_cohortId_idx` ON `cohort_members` (`cohort_id`);--> statement-breakpoint
CREATE INDEX `cohort_members_userId_idx` ON `cohort_members` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
ALTER TABLE `learner_maps` ALTER COLUMN "edges" TO "edges" text;--> statement-breakpoint
ALTER TABLE `learner_maps` ADD `control_text` text(100000);