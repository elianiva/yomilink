import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { cohorts, user } from "./auth-schema";

const timestamps = {
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
};

export const texts = sqliteTable("texts", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	content: text("content", { length: 1_000_000 }).notNull(),
	metadata: text("metadata", { mode: "json" }),
	images: text("images", { mode: "json" }),
	...timestamps,
});

export const topics = sqliteTable("topics", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description"),
	...timestamps,
});

export const goalMaps = sqliteTable(
	"goal_maps",
	{
		id: text("id").primaryKey(),
		teacherId: text("teacher_id").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		nodes: text("nodes", { mode: "json" }).notNull(),
		edges: text("edges", { mode: "json" }).notNull(),
		direction: text("direction", { enum: ["bi", "uni", "multi"] })
			.notNull()
			.default("bi"),
		type: text("type", { enum: ["teacher", "scratch"] })
			.notNull()
			.default("teacher"),
		textId: text("text_id").references(() => texts.id),
		topicId: text("topic_id").references(() => topics.id),
		...timestamps,
	},
	(table) => [
		index("goal_maps_teacherId_idx").on(table.teacherId),
		index("goal_maps_textId_idx").on(table.textId),
		index("goal_maps_topicId_idx").on(table.topicId),
	],
);

export const kits = sqliteTable(
	"kits",
	{
		id: text("id").primaryKey(),
		kitId: text("kit_id").notNull().unique(),
		name: text("name").notNull(),
		layout: text("layout", { enum: ["preset", "random"] })
			.notNull()
			.default("preset"),
		options: text("options", { mode: "json" }),
		enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		teacherId: text("teacher_id").notNull(),
		textId: text("text_id").references(() => texts.id),
		// Kit nodes (concepts + connectors from goal map)
		nodes: text("nodes", { mode: "json" }).notNull().default("[]"),
		// Kit edges - empty for students to build
		edges: text("edges", { mode: "json" }).notNull().default("[]"),
		...timestamps,
	},
	(table) => [
		index("kits_goalMapId_idx").on(table.goalMapId),
		index("kits_teacherId_idx").on(table.teacherId),
		index("kits_textId_idx").on(table.textId),
	],
);

export const kitSets = sqliteTable(
	"kit_sets",
	{
		id: text("id").primaryKey(),
		kitId: text("kit_id")
			.notNull()
			.references(() => kits.id),
		setId: text("set_id").notNull(),
		order: integer("order").notNull(),
		textId: text("text_id").references(() => texts.id),
		instructions: text("instructions"),
		...timestamps,
	},
	(table) => [
		index("kit_sets_kitId_idx").on(table.kitId),
		index("kit_sets_textId_idx").on(table.textId),
	],
);

// Assignment System
export const assignments = sqliteTable(
	"assignments",
	{
		id: text("id").primaryKey(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		kitId: text("kit_id")
			.notNull()
			.references(() => kits.id),
		title: text("title").notNull(),
		description: text("description"),
		readingMaterial: text("reading_material", { length: 1_000_000 }),
		timeLimitMinutes: integer("time_limit_minutes"),
		startDate: integer("start_date", { mode: "timestamp_ms" }),
		dueAt: integer("due_at", { mode: "timestamp_ms" }),
		createdBy: text("created_by").notNull(),
		...timestamps,
	},
	(table) => [
		index("assignments_goalMapId_idx").on(table.goalMapId),
		index("assignments_kitId_idx").on(table.kitId),
		index("assignments_createdBy_idx").on(table.createdBy),
	],
);

// Assignment Targets - links assignments to cohorts or individual users
export const assignmentTargets = sqliteTable(
	"assignment_targets",
	{
		id: text("id").primaryKey(),
		assignmentId: text("assignment_id")
			.notNull()
			.references(() => assignments.id, { onDelete: "cascade" }),
		cohortId: text("cohort_id").references(() => cohorts.id, {
			onDelete: "cascade",
		}),
		userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
		...timestamps,
	},
	(table) => [
		index("assignment_targets_assignmentId_idx").on(table.assignmentId),
		index("assignment_targets_cohortId_idx").on(table.cohortId),
		index("assignment_targets_userId_idx").on(table.userId),
	],
);

export const learnerMaps = sqliteTable(
	"learner_maps",
	{
		id: text("id").primaryKey(),
		assignmentId: text("assignment_id")
			.notNull()
			.references(() => assignments.id),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		kitId: text("kit_id")
			.notNull()
			.references(() => kits.id),
		userId: text("user_id").notNull(),
		nodes: text("nodes", { mode: "json" }),
		edges: text("edges", { mode: "json" }),
		controlText: text("control_text", { length: 100_000 }),
		status: text("status", { enum: ["draft", "submitted", "graded"] })
			.notNull()
			.default("draft"),
		attempt: integer("attempt").notNull().default(1),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		...timestamps,
	},
	(table) => [
		index("learner_maps_assignmentId_idx").on(table.assignmentId),
		index("learner_maps_goalMapId_idx").on(table.goalMapId),
		index("learner_maps_kitId_idx").on(table.kitId),
		index("learner_maps_userId_idx").on(table.userId),
	],
);

export const diagnoses = sqliteTable(
	"diagnoses",
	{
		id: text("id").primaryKey(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		learnerMapId: text("learner_map_id")
			.notNull()
			.references(() => learnerMaps.id),
		summary: text("summary"),
		perLink: text("per_link", { mode: "json" }),
		score: real("score"),
		rubricVersion: text("rubric_version"),
		...timestamps,
	},
	(table) => [
		index("diagnoses_goalMapId_idx").on(table.goalMapId),
		index("diagnoses_learnerMapId_idx").on(table.learnerMapId),
	],
);

export const feedback = sqliteTable(
	"feedback",
	{
		id: text("id").primaryKey(),
		learnerMapId: text("learner_map_id")
			.notNull()
			.references(() => learnerMaps.id),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		items: text("items", { mode: "json" }).notNull(),
		visibility: text("visibility", { enum: ["private", "public"] })
			.notNull()
			.default("private"),
		createdBy: text("created_by").notNull(),
		...timestamps,
	},
	(table) => [
		index("feedback_learnerMapId_idx").on(table.learnerMapId),
		index("feedback_goalMapId_idx").on(table.goalMapId),
	],
);

export const textsRelations = relations(texts, ({ many }) => ({
	topics: many(topics),
	goalMaps: many(goalMaps),
	kits: many(kits),
	kitSets: many(kitSets),
}));

export const topicsRelations = relations(topics, ({ many }) => ({
	text: many(texts),
	goalMaps: many(goalMaps),
}));

export const goalMapsRelations = relations(goalMaps, ({ one, many }) => ({
	teacher: one(user, {
		fields: [goalMaps.teacherId],
		references: [user.id],
	}),
	text: one(texts, {
		fields: [goalMaps.textId],
		references: [texts.id],
	}),
	topic: one(topics, {
		fields: [goalMaps.topicId],
		references: [topics.id],
	}),
	kits: many(kits),
	assignments: many(assignments),
	learnerMaps: many(learnerMaps),
	diagnoses: many(diagnoses),
	feedback: many(feedback),
}));

export const kitsRelations = relations(kits, ({ one, many }) => ({
	goalMap: one(goalMaps, {
		fields: [kits.goalMapId],
		references: [goalMaps.id],
	}),
	teacher: one(user, {
		fields: [kits.teacherId],
		references: [user.id],
	}),
	text: one(texts, {
		fields: [kits.textId],
		references: [texts.id],
	}),
	kitSets: many(kitSets),
	assignments: many(assignments),
	learnerMaps: many(learnerMaps),
}));

export const kitSetsRelations = relations(kitSets, ({ one }) => ({
	kit: one(kits, {
		fields: [kitSets.kitId],
		references: [kits.id],
	}),
	text: one(texts, {
		fields: [kitSets.textId],
		references: [texts.id],
	}),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
	goalMap: one(goalMaps, {
		fields: [assignments.goalMapId],
		references: [goalMaps.id],
	}),
	kit: one(kits, {
		fields: [assignments.kitId],
		references: [kits.id],
	}),
	creator: one(user, {
		fields: [assignments.createdBy],
		references: [user.id],
	}),
	targets: many(assignmentTargets),
	learnerMaps: many(learnerMaps),
}));

export const assignmentTargetsRelations = relations(
	assignmentTargets,
	({ one }) => ({
		assignment: one(assignments, {
			fields: [assignmentTargets.assignmentId],
			references: [assignments.id],
		}),
		cohort: one(cohorts, {
			fields: [assignmentTargets.cohortId],
			references: [cohorts.id],
		}),
		user: one(user, {
			fields: [assignmentTargets.userId],
			references: [user.id],
		}),
	}),
);

export const learnerMapsRelations = relations(learnerMaps, ({ one, many }) => ({
	assignment: one(assignments, {
		fields: [learnerMaps.assignmentId],
		references: [assignments.id],
	}),
	goalMap: one(goalMaps, {
		fields: [learnerMaps.goalMapId],
		references: [goalMaps.id],
	}),
	kit: one(kits, {
		fields: [learnerMaps.kitId],
		references: [kits.id],
	}),
	user: one(user, {
		fields: [learnerMaps.userId],
		references: [user.id],
	}),
	diagnoses: many(diagnoses),
	feedback: many(feedback),
}));

export const diagnosesRelations = relations(diagnoses, ({ one }) => ({
	goalMap: one(goalMaps, {
		fields: [diagnoses.goalMapId],
		references: [goalMaps.id],
	}),
	learnerMap: one(learnerMaps, {
		fields: [diagnoses.learnerMapId],
		references: [learnerMaps.id],
	}),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
	learnerMap: one(learnerMaps, {
		fields: [feedback.learnerMapId],
		references: [learnerMaps.id],
	}),
	goalMap: one(goalMaps, {
		fields: [feedback.goalMapId],
		references: [goalMaps.id],
	}),
}));

export const forms = sqliteTable(
	"forms",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		description: text("description"),
		type: text("type", {
			enum: ["pre_test", "post_test", "registration", "control"],
		})
			.notNull()
			.default("registration"),
		status: text("status", { enum: ["draft", "published"] })
			.notNull()
			.default("draft"),
		unlockConditions: text("unlock_conditions", { mode: "json" }),
		createdBy: text("created_by").notNull(),
		...timestamps,
	},
	(table) => [index("forms_createdBy_idx").on(table.createdBy)],
);

export const questions = sqliteTable(
	"questions",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id, { onDelete: "cascade" }),
		type: text("type", { enum: ["mcq", "likert", "text"] }).notNull(),
		questionText: text("question_text").notNull(),
		options: text("options", { mode: "json" }),
		orderIndex: integer("order_index").notNull(),
		required: integer("required", { mode: "boolean" }).notNull().default(true),
		...timestamps,
	},
	(table) => [index("questions_formId_idx").on(table.formId)],
);

export const formResponses = sqliteTable(
	"form_responses",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		answers: text("answers", { mode: "json" }).notNull(),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		timeSpentSeconds: integer("time_spent_seconds"),
		...timestamps,
	},
	(table) => [
		index("form_responses_formId_idx").on(table.formId),
		index("form_responses_userId_idx").on(table.userId),
	],
);

export const formProgress = sqliteTable(
	"form_progress",
	{
		id: text("id").primaryKey(),
		formId: text("form_id")
			.notNull()
			.references(() => forms.id),
		userId: text("user_id")
			.notNull()
			.references(() => user.id),
		status: text("status", { enum: ["locked", "available", "completed"] })
			.notNull()
			.default("locked"),
		unlockedAt: integer("unlocked_at", { mode: "timestamp_ms" }),
		completedAt: integer("completed_at", { mode: "timestamp_ms" }),
		...timestamps,
	},
	(table) => [
		index("form_progress_formId_idx").on(table.formId),
		index("form_progress_userId_idx").on(table.userId),
	],
);

export const formsRelations = relations(forms, ({ one, many }) => ({
	creator: one(user, {
		fields: [forms.createdBy],
		references: [user.id],
	}),
	questions: many(questions),
	responses: many(formResponses),
	progress: many(formProgress),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
	form: one(forms, {
		fields: [questions.formId],
		references: [forms.id],
	}),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
	form: one(forms, {
		fields: [formResponses.formId],
		references: [forms.id],
	}),
	user: one(user, {
		fields: [formResponses.userId],
		references: [user.id],
	}),
}));

export const formProgressRelations = relations(formProgress, ({ one }) => ({
	form: one(forms, {
		fields: [formProgress.formId],
		references: [forms.id],
	}),
	user: one(user, {
		fields: [formProgress.userId],
		references: [user.id],
	}),
}));
