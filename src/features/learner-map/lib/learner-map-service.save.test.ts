import { beforeEach, describe, expect, it } from "vite-plus/test";
import { eq } from "drizzle-orm";
import { Effect, Either } from "effect";

import {
	createTestAssignment,
	createTestGoalMap,
	createTestKit,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import { assignmentTargets, learnerMaps } from "@/server/db/schema/app-schema";

import { saveLearnerMap } from "./learner-map-service";

describe("learner-map-service > saveLearnerMap", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	const setupStudentAssignment = (studentId: string) =>
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

			return { assignment, student };
		});

	it("should return error for non-existent assignment", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* Effect.either(
				saveLearnerMap(student.id, {
					assignmentId: "non-existent",
					nodes: "[]",
					edges: "[]",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("AssignmentNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should create new learner map on first save", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment("");

			const nodes = JSON.stringify([
				{ id: "n1", data: {}, position: { x: 0, y: 0 } },
			]);
			const edges = JSON.stringify([{ id: "e1", source: "n1", target: "n2" }]);

			const result = yield* saveLearnerMap(student.id, {
				assignmentId: assignment.id,
				nodes,
				edges,
			});

			expect(result).toBe(true);

			const db = yield* Database;
			const saved = yield* db.select().from(learnerMaps).limit(1);

			expect(saved).toHaveLength(1);
			expect(saved[0]?.status).toBe("draft");
			expect(saved[0]?.attempt).toBe(1);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should update existing learner map", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment("");

			const db = yield* Database;
			const learnerMapId = crypto.randomUUID();

			yield* db.insert(learnerMaps).values({
				id: learnerMapId,
				assignmentId: assignment.id,
				goalMapId: assignment.goalMapId,
				kitId: assignment.kitId,
				userId: student.id,
				nodes: "[]",
				edges: "[]",
				status: "draft",
				attempt: 1,
			});

			const newNodes = JSON.stringify([
				{ id: "updated", data: {}, position: { x: 0, y: 0 } },
			]);
			const newEdges = JSON.stringify([{ id: "e1", source: "a", target: "b" }]);

			const result = yield* saveLearnerMap(student.id, {
				assignmentId: assignment.id,
				nodes: newNodes,
				edges: newEdges,
			});

			expect(result).toBe(true);

			const updated = yield* db
				.select()
				.from(learnerMaps)
				.where(eq(learnerMaps.id, learnerMapId))
				.limit(1);

			expect(updated[0]?.nodes).toBe(newNodes);
			expect(updated[0]?.edges).toBe(newEdges);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should not allow editing submitted map", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment("");

			const db = yield* Database;

			yield* db.insert(learnerMaps).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				goalMapId: assignment.goalMapId,
				kitId: assignment.kitId,
				userId: student.id,
				nodes: "[]",
				edges: "[]",
				status: "submitted",
				attempt: 1,
			});

			const result = yield* Effect.either(
				saveLearnerMap(student.id, {
					assignmentId: assignment.id,
					nodes: "[]",
					edges: "[]",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("LearnerMapAlreadySubmittedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should deny access when student has no assignment target", () =>
		Effect.gen(function* () {
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

			const result = yield* Effect.either(
				saveLearnerMap(student.id, {
					assignmentId: assignment.id,
					nodes: "[]",
					edges: "[]",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("AccessDeniedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
