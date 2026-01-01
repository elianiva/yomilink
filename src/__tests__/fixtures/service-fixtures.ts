import { eq } from "drizzle-orm";
import { Effect } from "effect";
import {
	assignments,
	goalMaps,
	kits,
	topics,
} from "@/server/db/schema/app-schema";
import { user } from "@/server/db/schema/auth-schema";
import { Database } from "@/server/db/client";

export const createTestUser = (overrides = {}) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const userData = {
			id: crypto.randomUUID(),
			name: "Test User",
			email: `test-${crypto.randomUUID()}@example.com`,
			emailVerified: true,
			image: null,
			role: "teacher",
			...overrides,
		};

		yield* db.insert(user).values(userData as typeof user.$inferInsert);
		return userData as typeof user.$inferInsert;
	});

export const createTestTopic = (overrides = {}) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const topicData = {
			id: crypto.randomUUID(),
			title: "Test Topic",
			description: "Test Description",
			...overrides,
		};

		yield* db.insert(topics).values(topicData as typeof topics.$inferInsert);
		return topicData as typeof topics.$inferInsert;
	});

export const createTestGoalMap = (userId: string, overrides = {}) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const goalMapData = {
			id: crypto.randomUUID(),
			title: "Test Goal Map",
			description: "Test Description",
			nodes: "[]",
			edges: "[]",
			direction: "bi" as const,
			type: "teacher" as const,
			teacherId: userId,
			topicId: null,
			textId: null,
			...overrides,
		};

		yield* db
			.insert(goalMaps)
			.values(goalMapData as typeof goalMaps.$inferInsert);
		return goalMapData as typeof goalMaps.$inferInsert;
	});

export const createTestKit = (
	goalMapId: string,
	teacherId: string,
	overrides = {},
) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const kitId = crypto.randomUUID();
		const kitData = {
			id: kitId,
			kitId,
			name: "Test Kit",
			goalMapId,
			layout: "preset" as const,
			nodes: "[]",
			edges: "[]",
			teacherId,
			textId: null,
			...overrides,
		};

		yield* db.insert(kits).values(kitData as typeof kits.$inferInsert);
		return kitData as typeof kits.$inferInsert;
	});

export const createTestAssignment = (
	userId: string,
	goalMapId: string,
	kitId: string,
	overrides = {},
) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const assignmentData = {
			id: crypto.randomUUID(),
			title: "Test Assignment",
			description: "Test Description",
			goalMapId,
			kitId,
			startDate: new Date(),
			dueAt: null,
			createdBy: userId,
			...overrides,
		};

		yield* db
			.insert(assignments)
			.values(assignmentData as typeof assignments.$inferInsert);
		return assignmentData as typeof assignments.$inferInsert;
	});

export const cleanupTestUser = (userId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(user).where(eq(user.id, userId));
	});

export const cleanupTestTopic = (topicId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(topics).where(eq(topics.id, topicId));
	});

export const cleanupTestGoalMap = (goalMapId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(goalMaps).where(eq(goalMaps.id, goalMapId));
	});

export const cleanupTestKit = (kitId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(kits).where(eq(kits.id, kitId));
	});

export const cleanupTestAssignment = (assignmentId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(assignments).where(eq(assignments.id, assignmentId));
	});
