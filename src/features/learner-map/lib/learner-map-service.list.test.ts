import { beforeEach, describe, expect, it } from "vite-plus/test";
import { Effect } from "effect";

import {
	createTestAssignment,
	createTestGoalMap,
	createTestKit,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { assignmentTargets, learnerMaps } from "@/server/db/schema/app-schema";

import { listStudentAssignments } from "./learner-map-service";

describe("learner-map-service > listStudentAssignments", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return empty array when no assignments exist", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* listStudentAssignments(student.id);

			expect(result).toHaveLength(0);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return assignments targeted to user directly", () =>
		Effect.gen(function* () {
			const db = yield* Database;
			const teacher = yield* createTestUser({ email: "teacher@test.com" });
			const student = yield* createTestUser({
				email: "student@test.com",
				role: "student",
			});

			const goalMap = yield* createTestGoalMap(teacher.id);
			const kit = yield* createTestKit(goalMap.id, teacher.id);
			const assignment = yield* createTestAssignment(
				teacher.id,
				goalMap.id,
				kit.id,
				{ title: "Test Assignment" },
			);

			yield* db.insert(assignmentTargets).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				userId: student.id,
			});

			const result = yield* listStudentAssignments(student.id);

			expect(result).toHaveLength(1);
			expect(result[0]?.title).toBe("Test Assignment");
			expect(result[0]?.status).toBe("not_started");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return learner map status when student has started", () =>
		Effect.gen(function* () {
			const db = yield* Database;
			const teacher = yield* createTestUser({ email: "teacher@test.com" });
			const student = yield* createTestUser({
				email: "student@test.com",
				role: "student",
			});

			const goalMap = yield* createTestGoalMap(teacher.id);
			const kit = yield* createTestKit(goalMap.id, teacher.id);
			const assignment = yield* createTestAssignment(
				teacher.id,
				goalMap.id,
				kit.id,
			);

			yield* db.insert(assignmentTargets).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				userId: student.id,
			});

			yield* db.insert(learnerMaps).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				goalMapId: goalMap.id,
				kitId: kit.id,
				userId: student.id,
				nodes: "[]",
				edges: "[]",
				status: "draft",
				attempt: 1,
			});

			const result = yield* listStudentAssignments(student.id);

			expect(result).toHaveLength(1);
			expect(result[0]?.status).toBe("draft");
			expect(result[0]?.attempt).toBe(1);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should identify late assignments", () =>
		Effect.gen(function* () {
			const db = yield* Database;
			const teacher = yield* createTestUser({ email: "teacher@test.com" });
			const student = yield* createTestUser({
				email: "student@test.com",
				role: "student",
			});

			const goalMap = yield* createTestGoalMap(teacher.id);
			const kit = yield* createTestKit(goalMap.id, teacher.id);

			const pastDue = new Date(Date.now() - 86400000);
			const assignment = yield* createTestAssignment(
				teacher.id,
				goalMap.id,
				kit.id,
				{ dueAt: pastDue },
			);

			yield* db.insert(assignmentTargets).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				userId: student.id,
			});

			const result = yield* listStudentAssignments(student.id);

			expect(result).toHaveLength(1);
			expect(result[0]?.isLate).toBe(true);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
