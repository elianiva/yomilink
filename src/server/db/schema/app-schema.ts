import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const goalMaps = sqliteTable("goal_maps", {
	id: text("id").primaryKey(),
	goalMapId: text("goal_map_id").notNull().unique(),
	teacherId: text("teacher_id").notNull(),
	title: text("title").notNull(),
	description: text("description"),
	nodes: text("nodes", { length: 1_000_000 }).notNull(),
	edges: text("edges", { length: 1_000_000 }).notNull(),
	updatedAt: integer("updated_at").notNull(),
});

export const kits = sqliteTable("kits", {
	id: text("id").primaryKey(),
	goalMapId: text("goal_map_id").notNull(),
	createdBy: text("created_by").notNull(),
	nodes: text("nodes", { length: 1_000_000 }).notNull(),
	edges: text("edges", { length: 1_000_000 }).notNull(),
	constraints: text("constraints"),
	version: integer("version"),
	createdAt: integer("created_at").notNull(),
});

export const learnerMaps = sqliteTable("learner_maps", {
	id: text("id").primaryKey(),
	goalMapId: text("goal_map_id").notNull(),
	kitId: text("kit_id").notNull(),
	userId: text("user_id").notNull(),
	nodes: text("nodes", { length: 1_000_000 }).notNull(),
	edges: text("edges", { length: 1_000_000 }).notNull(),
	status: text("status").notNull(),
	attempt: integer("attempt"),
	startedAt: integer("started_at"),
	submittedAt: integer("submitted_at"),
	diagnosisId: text("diagnosis_id"),
});

export const diagnoses = sqliteTable("diagnoses", {
	id: text("id").primaryKey(),
	goalMapId: text("goal_map_id").notNull(),
	learnerMapId: text("learner_map_id").notNull(),
	summary: text("summary", { length: 1_000_000 }).notNull(),
	perLink: text("per_link", { length: 1_000_000 }).notNull(),
	score: real("score").notNull(),
	rubricVersion: text("rubric_version"),
	createdAt: integer("created_at").notNull(),
});

export const groupMaps = sqliteTable("group_maps", {
	id: text("id").primaryKey(),
	goalMapId: text("goal_map_id").notNull(),
	aggregation: text("aggregation", { length: 1_000_000 }).notNull(),
	cohortId: text("cohort_id"),
	createdAt: integer("created_at").notNull(),
});

export const feedback = sqliteTable("feedback", {
	id: text("id").primaryKey(),
	learnerMapId: text("learner_map_id").notNull(),
	goalMapId: text("goal_map_id").notNull(),
	items: text("items", { length: 1_000_000 }).notNull(),
	visibility: text("visibility").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const assignments = sqliteTable("assignments", {
	id: text("id").primaryKey(),
	goalMapId: text("goal_map_id").notNull(),
	kitId: text("kit_id").notNull(),
	title: text("title").notNull(),
	dueAt: integer("due_at"),
	cohortId: text("cohort_id"),
	createdBy: text("created_by").notNull(),
	createdAt: integer("created_at").notNull(),
});

export const events = sqliteTable("events", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull(),
	event: text("event").notNull(),
	payload: text("payload", { length: 1_000_000 }),
	createdAt: integer("created_at").notNull(),
});
