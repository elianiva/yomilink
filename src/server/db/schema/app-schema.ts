import { relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	real,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// Content Management
export const texts = sqliteTable("texts", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	type: text("type", {
		enum: ["plain", "html", "markdown", "url", "video", "pdf"],
	})
		.notNull()
		.default("plain"),
	content: text("content").notNull(),
	metadata: text("metadata"), // JSON
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull(),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull(),
});

export const topics = sqliteTable(
	"topics",
	{
		id: text("id").primaryKey(),
		title: text("title").notNull(),
		description: text("description"),
		textId: text("text_id").references(() => texts.id),
		enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [index("topics_textId_idx").on(table.textId)],
);

// Concept Mapping
export const goalMaps = sqliteTable(
	"goal_maps",
	{
		id: text("id").primaryKey(),
		goalMapId: text("goal_map_id").notNull().unique(),
		teacherId: text("teacher_id").notNull(),
		title: text("title").notNull(),
		description: text("description"),
		nodes: text("nodes", { length: 1_000_000 }).notNull(),
		edges: text("edges", { length: 1_000_000 }).notNull(),
		direction: text("direction", { enum: ["bi", "uni", "multi"] })
			.notNull()
			.default("bi"),
		type: text("type", { enum: ["teacher", "scratch"] })
			.notNull()
			.default("teacher"),
		textId: text("text_id").references(() => texts.id),
		topicId: text("topic_id").references(() => topics.id),
		refMapId: text("ref_map_id"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("goal_maps_teacherId_idx").on(table.teacherId),
		index("goal_maps_textId_idx").on(table.textId),
		index("goal_maps_topicId_idx").on(table.topicId),
	],
);

// Kit System
export const kits = sqliteTable(
	"kits",
	{
		id: text("id").primaryKey(),
		kitId: text("kit_id").notNull().unique(),
		name: text("name").notNull(),
		layout: text("layout", { enum: ["preset", "random"] })
			.notNull()
			.default("preset"),
		options: text("options"), // JSON with kit options
		enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		teacherId: text("teacher_id").notNull(),
		textId: text("text_id").references(() => texts.id),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
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
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
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
		dueAt: integer("due_at", { mode: "timestamp_ms" }),
		cohortId: text("cohort_id").notNull(),
		createdBy: text("created_by").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("assignments_goalMapId_idx").on(table.goalMapId),
		index("assignments_kitId_idx").on(table.kitId),
		index("assignments_cohortId_idx").on(table.cohortId),
	],
);

// Learner Progress
export const learnerMaps = sqliteTable(
	"learner_maps",
	{
		id: text("id").primaryKey(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		kitId: text("kit_id")
			.notNull()
			.references(() => kits.id),
		userId: text("user_id").notNull(),
		nodes: text("nodes", { length: 1_000_000 }).notNull(),
		edges: text("edges", { length: 1_000_000 }).notNull(),
		status: text("status", { enum: ["draft", "submitted", "graded"] })
			.notNull()
			.default("draft"),
		attempt: integer("attempt").notNull().default(1),
		submittedAt: integer("submitted_at", { mode: "timestamp_ms" }),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
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
		perLink: text("per_link", { length: 1_000_000 }), // JSON
		score: real("score"),
		rubricVersion: text("rubric_version"),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
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
		items: text("items", { length: 1_000_000 }).notNull(), // JSON
		visibility: text("visibility", { enum: ["private", "public"] })
			.notNull()
			.default("private"),
		createdBy: text("created_by").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("feedback_learnerMapId_idx").on(table.learnerMapId),
		index("feedback_goalMapId_idx").on(table.goalMapId),
	],
);

export const groupMaps = sqliteTable(
	"group_maps",
	{
		id: text("id").primaryKey(),
		goalMapId: text("goal_map_id")
			.notNull()
			.references(() => goalMaps.id),
		aggregation: text("aggregation", { length: 1_000_000 }).notNull(), // JSON
		cohortId: text("cohort_id").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("group_maps_goalMapId_idx").on(table.goalMapId),
		index("group_maps_cohortId_idx").on(table.cohortId),
	],
);

// Analytics
export const events = sqliteTable(
	"events",
	{
		id: text("id").primaryKey(),
		userId: text("user_id"),
		event: text("event").notNull(),
		payload: text("payload", { length: 1_000_000 }), // JSON
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [index("events_userId_idx").on(table.userId)],
);

// Relations
export const textsRelations = relations(texts, ({ many }) => ({
	topics: many(topics),
	goalMaps: many(goalMaps),
	kits: many(kits),
	kitSets: many(kitSets),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
	text: one(texts, {
		fields: [topics.textId],
		references: [texts.id],
	}),
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
	groupMaps: many(groupMaps),
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

export const assignmentsRelations = relations(assignments, ({ one }) => ({
	goalMap: one(goalMaps, {
		fields: [assignments.goalMapId],
		references: [goalMaps.id],
	}),
	kit: one(kits, {
		fields: [assignments.kitId],
		references: [kits.id],
	}),
}));

export const learnerMapsRelations = relations(learnerMaps, ({ one, many }) => ({
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

export const groupMapsRelations = relations(groupMaps, ({ one }) => ({
	goalMap: one(goalMaps, {
		fields: [groupMaps.goalMapId],
		references: [goalMaps.id],
	}),
}));

export const eventsRelations = relations(events, ({ one }) => ({
	user: one(user, {
		fields: [events.userId],
		references: [user.id],
	}),
}));
