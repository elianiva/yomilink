import { sql } from "drizzle-orm";
import {
	sqliteTable,
	AnySQLiteColumn,
	index,
	foreignKey,
	text,
	integer,
	uniqueIndex,
	real,
} from "drizzle-orm/sqlite-core";

export const assignmentTargets = sqliteTable(
	"assignment_targets",
	{
		id: text().primaryKey().notNull(),
		assignmentId: text("assignment_id")
			.notNull()
			.references(() => assignments.id, { onDelete: "cascade" }),
		cohortId: text("cohort_id").references(() => cohorts.id, { onDelete: "cascade" }),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("assignment_targets_userId_idx").on(table.userId),
		index("assignment_targets_cohortId_idx").on(table.cohortId),
		index("assignment_targets_assignmentId_idx").on(table.assignmentId),
	],
);

export const forms = sqliteTable(
	"forms",
	{
		id: text().primaryKey().notNull(),
		title: text().notNull(),
		description: text(),
		type: text().default("registration").notNull(),
		status: text().default("draft").notNull(),
		unlockConditions: text("unlock_conditions"),
		createdBy: text("created_by").notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		audience: text().default("all").notNull(),
		readingMaterialSections: text("reading_material_sections"),
		deletedAt: integer("deleted_at"),
	},
	(table) => [index("forms_createdBy_idx").on(table.createdBy)],
);

export const questions = sqliteTable(
	"questions",
	{
		id: text().primaryKey().notNull(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		type: text().notNull(),
		questionText: text("question_text").notNull(),
		options: text(),
		orderIndex: integer("order_index").notNull(),
		required: integer().default(true).notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [index("questions_formId_idx").on(table.formId)],
);

export const texts = sqliteTable("texts", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	content: text({ length: 1000000 }).notNull(),
	metadata: text(),
	images: text(),
	createdAt: integer("created_at")
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at")
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	deletedAt: integer("deleted_at"),
});

export const topics = sqliteTable("topics", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	createdAt: integer("created_at")
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at")
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	deletedAt: integer("deleted_at"),
});

export const account = sqliteTable(
	"account",
	{
		id: text().primaryKey().notNull(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: integer("access_token_expires_at"),
		refreshTokenExpiresAt: integer("refresh_token_expires_at"),
		scope: text(),
		password: text(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at").notNull(),
	},
	(table) => [index("account_userId_idx").on(table.userId)],
);

export const cohortMembers = sqliteTable(
	"cohort_members",
	{
		id: text().primaryKey().notNull(),
		cohortId: text("cohort_id")
			.notNull()
			.references(() => cohorts.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text().default("member").notNull(),
		joinedAt: integer("joined_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("cohort_members_userId_idx").on(table.userId),
		index("cohort_members_cohortId_idx").on(table.cohortId),
	],
);

export const cohorts = sqliteTable("cohorts", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: integer("created_at")
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at")
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	deletedAt: integer("deleted_at"),
});

export const session = sqliteTable(
	"session",
	{
		id: text().primaryKey().notNull(),
		expiresAt: integer("expires_at").notNull(),
		token: text().notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at").notNull(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		impersonatedBy: text("impersonated_by"),
	},
	(table) => [
		index("session_userId_idx").on(table.userId),
		uniqueIndex("session_token_unique").on(table.token),
	],
);

export const user = sqliteTable(
	"user",
	{
		id: text().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		studentId: text("student_id"),
		emailVerified: integer("email_verified").default(false).notNull(),
		image: text(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		role: text(),
		age: integer(),
		jlptLevel: text("jlpt_level"),
		japaneseLearningDuration: integer("japanese_learning_duration"),
		previousJapaneseScore: real("previous_japanese_score"),
		mediaConsumption: real("media_consumption"),
		motivation: text(),
		banned: integer().default(false),
		banReason: text("ban_reason"),
		banExpires: integer("ban_expires"),
		studyGroup: text("study_group"),
		consentGiven: integer("consent_given").default(false),
		deletedAt: integer("deleted_at"),
	},
	(table) => [uniqueIndex("user_email_unique").on(table.email)],
);

export const verification = sqliteTable(
	"verification",
	{
		id: text().primaryKey().notNull(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: integer("expires_at").notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const whitelistEntries = sqliteTable(
	"whitelist_entries",
	{
		id: text().primaryKey().notNull(),
		studentId: text("student_id").notNull(),
		name: text().notNull(),
		cohortId: text("cohort_id").references(() => cohorts.id, { onDelete: "set null" }),
		claimedUserId: text("claimed_user_id").references(() => user.id, { onDelete: "set null" }),
		claimedAt: integer("claimed_at"),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("whitelist_entries_claimedUserId_idx").on(table.claimedUserId),
		uniqueIndex("whitelist_entries_claimed_user_id_unique").on(table.claimedUserId),
		uniqueIndex("whitelist_entries_student_id_unique").on(table.studentId),
	],
);

export const assignments = sqliteTable(
	"assignments",
	{
		id: text().primaryKey().notNull(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id, { onDelete: "cascade" }),
		kitId: text("kit_id")
			.notNull()
			.references(() => kits.id, { onDelete: "cascade" }),
		title: text().notNull(),
		description: text(),
		readingMaterial: text("reading_material", { length: 1000000 }),
		timeLimitMinutes: integer("time_limit_minutes"),
		startDate: integer("start_date"),
		dueAt: integer("due_at"),
		preTestFormId: text("pre_test_form_id").references(() => forms.id, {
			onDelete: "set null",
		}),
		postTestFormId: text("post_test_form_id").references(() => forms.id, {
			onDelete: "set null",
		}),
		delayedPostTestFormId: text("delayed_post_test_form_id").references(() => forms.id, {
			onDelete: "set null",
		}),
		tamFormId: text("tam_form_id").references(() => forms.id, { onDelete: "set null" }),
		delayedPostTestDelayDays: integer("delayed_post_test_delay_days").default(7),
		createdBy: text("created_by").notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("assignments_createdBy_idx").on(table.createdBy),
		index("assignments_kitId_idx").on(table.kitId),
		index("assignments_goalMapId_idx").on(table.goalMapId),
	],
);

export const diagnoses = sqliteTable(
	"diagnoses",
	{
		id: text().primaryKey().notNull(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id, { onDelete: "cascade" }),
		learnerMapId: text("learner_map_id")
			.notNull()
			.references(() => learnerMaps.id, { onDelete: "cascade" }),
		summary: text(),
		perLink: text("per_link"),
		score: real(),
		rubricVersion: text("rubric_version"),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("diagnoses_learnerMapId_idx").on(table.learnerMapId),
		index("diagnoses_goalMapId_idx").on(table.goalMapId),
	],
);

export const feedback = sqliteTable(
	"feedback",
	{
		id: text().primaryKey().notNull(),
		learnerMapId: text("learner_map_id")
			.notNull()
			.references(() => learnerMaps.id, { onDelete: "cascade" }),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id, { onDelete: "cascade" }),
		items: text().notNull(),
		visibility: text().default("private").notNull(),
		createdBy: text("created_by").notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("feedback_goalMapId_idx").on(table.goalMapId),
		index("feedback_learnerMapId_idx").on(table.learnerMapId),
	],
);

export const formProgress = sqliteTable(
	"form_progress",
	{
		id: text().primaryKey().notNull(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		status: text().default("locked").notNull(),
		unlockedAt: integer("unlocked_at"),
		completedAt: integer("completed_at"),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("form_progress_userId_idx").on(table.userId),
		index("form_progress_formId_idx").on(table.formId),
	],
);

export const formResponses = sqliteTable(
	"form_responses",
	{
		id: text().primaryKey().notNull(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		answers: text().notNull(),
		submittedAt: integer("submitted_at"),
		timeSpentSeconds: integer("time_spent_seconds"),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		uniqueIndex("form_responses_form_user_unique").on(table.formId, table.userId),
		index("form_responses_userId_idx").on(table.userId),
		index("form_responses_formId_idx").on(table.formId),
	],
);

export const learnerMaps = sqliteTable(
	"learner_maps",
	{
		id: text().primaryKey().notNull(),
		assignmentId: text("assignment_id")
			.notNull()
			.references(() => assignments.id, { onDelete: "cascade" }),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id, { onDelete: "cascade" }),
		kitId: text("kit_id")
			.notNull()
			.references(() => kits.id, { onDelete: "cascade" }),
		userId: text("user_id").notNull(),
		nodes: text(),
		edges: text(),
		controlText: text("control_text", { length: 100000 }),
		status: text().default("draft").notNull(),
		attempt: integer().default(1).notNull(),
		submittedAt: integer("submitted_at"),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		uniqueIndex("learner_maps_assignment_user_attempt_unique").on(
			table.assignmentId,
			table.userId,
			table.attempt,
		),
		index("learner_maps_userId_idx").on(table.userId),
		index("learner_maps_kitId_idx").on(table.kitId),
		index("learner_maps_goalMapId_idx").on(table.goalMapId),
		index("learner_maps_assignmentId_idx").on(table.assignmentId),
	],
);

export const goalMaps = sqliteTable(
	"goal_maps",
	{
		id: text().primaryKey().notNull(),
		teacherId: text("teacher_id").notNull(),
		title: text().notNull(),
		description: text(),
		nodes: text().notNull(),
		edges: text().notNull(),
		direction: text().default("bi").notNull(),
		type: text().default("teacher").notNull(),
		textId: text("text_id").references(() => texts.id, { onDelete: "set null" }),
		topicId: text("topic_id").references(() => topics.id),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("goal_maps_topicId_idx").on(table.topicId),
		index("goal_maps_textId_idx").on(table.textId),
		index("goal_maps_teacherId_idx").on(table.teacherId),
	],
);

export const kits = sqliteTable(
	"kits",
	{
		id: text().primaryKey().notNull(),
		kitId: text("kit_id").notNull(),
		name: text().notNull(),
		layout: text().default("preset").notNull(),
		options: text(),
		enabled: integer().default(true).notNull(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id, { onDelete: "cascade" }),
		teacherId: text("teacher_id").notNull(),
		textId: text("text_id").references(() => texts.id, { onDelete: "set null" }),
		nodes: text().default("[]").notNull(),
		edges: text().default("[]").notNull(),
		createdAt: integer("created_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at")
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		deletedAt: integer("deleted_at"),
	},
	(table) => [
		index("kits_textId_idx").on(table.textId),
		index("kits_teacherId_idx").on(table.teacherId),
		index("kits_goalMapId_idx").on(table.goalMapId),
		uniqueIndex("kits_kit_id_unique").on(table.kitId),
	],
);
