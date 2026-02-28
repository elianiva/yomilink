import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "@/server/db/client";
import {
	assignments,
	diagnoses,
	forms,
	goalMaps,
	kits,
	learnerMaps,
	topics,
} from "@/server/db/schema/app-schema";
import { user } from "@/server/db/schema/auth-schema";

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

		yield* db.insert(goalMaps).values(goalMapData as typeof goalMaps.$inferInsert);
		return goalMapData as typeof goalMaps.$inferInsert;
	});

export const createTestKit = (goalMapId: string, teacherId: string, overrides = {}) =>
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

		yield* db.insert(assignments).values(assignmentData as typeof assignments.$inferInsert);
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

export const createTestLearnerMap = (
	userId: string,
	assignmentId: string,
	goalMapId: string,
	kitId: string,
	overrides = {},
) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const learnerMapData = {
			id: crypto.randomUUID(),
			userId,
			assignmentId,
			goalMapId,
			kitId,
			nodes: "[]",
			edges: "[]",
			status: "draft" as const,
			attempt: 1,
			submittedAt: null,
			...overrides,
		};

		yield* db.insert(learnerMaps).values(learnerMapData as typeof learnerMaps.$inferInsert);
		return learnerMapData as typeof learnerMaps.$inferInsert;
	});

export const createTestDiagnosis = (goalMapId: string, learnerMapId: string, overrides = {}) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const diagnosisData = {
			id: crypto.randomUUID(),
			goalMapId,
			learnerMapId,
			summary: null,
			perLink: null,
			score: null,
			rubricVersion: null,
			...overrides,
		};

		yield* db.insert(diagnoses).values(diagnosisData as typeof diagnoses.$inferInsert);
		return diagnosisData as typeof diagnoses.$inferInsert;
	});

export const cleanupTestLearnerMap = (learnerMapId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(learnerMaps).where(eq(learnerMaps.id, learnerMapId));
	});

export const cleanupTestDiagnosis = (diagnosisId: string) =>
	Effect.gen(function* () {
		const db = yield* Database;
		yield* db.delete(diagnoses).where(eq(diagnoses.id, diagnosisId));
	});

export const createTestForm = (userId: string, overrides = {}) =>
	Effect.gen(function* () {
		const db = yield* Database;
		const formData = {
			id: crypto.randomUUID(),
			title: "Test Form",
			description: null,
			type: "registration" as const,
			status: "draft" as const,
			unlockConditions: null,
			createdBy: userId,
			...overrides,
		};

		yield* db.insert(forms).values(formData as typeof forms.$inferInsert);
		return formData as typeof forms.$inferInsert;
	});
