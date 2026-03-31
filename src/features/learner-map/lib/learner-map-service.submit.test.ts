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
import { assignmentTargets, diagnoses, learnerMaps } from "@/server/db/schema/app-schema";

import { submitLearnerMap } from "./learner-map-service";

describe("learner-map-service > submitLearnerMap", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	const setupStudentAssignment = () =>
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

			return { assignment, goalMap, student };
		});

	it("should return error when learner map does not exist", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* Effect.either(
				submitLearnerMap(student.id, {
					assignmentId: "non-existent",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("LearnerMapNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return error for already submitted map", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment();

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
				submitLearnerMap(student.id, {
					assignmentId: assignment.id,
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("LearnerMapAlreadySubmittedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should submit learner map and create diagnosis", () =>
		Effect.gen(function* () {
			const { assignment, goalMap, student } = yield* setupStudentAssignment();

			const db = yield* Database;
			const learnerMapId = crypto.randomUUID();

			yield* db.insert(learnerMaps).values({
				id: learnerMapId,
				assignmentId: assignment.id,
				goalMapId: goalMap.id,
				kitId: assignment.kitId,
				userId: student.id,
				nodes: [],
				edges: [{ id: "le1", source: "a", target: "b" }],
				status: "draft",
				attempt: 1,
			});

			const result = yield* submitLearnerMap(student.id, {
				assignmentId: assignment.id,
			});

			expect(result.diagnosisId).toBeDefined();
			expect(result.diagnosis).toBeDefined();

			const updated = yield* db
				.select()
				.from(learnerMaps)
				.where(eq(learnerMaps.id, learnerMapId))
				.limit(1);

			expect(updated[0]?.status).toBe("submitted");
			expect(updated[0]?.submittedAt).not.toBeNull();

			const savedDiagnosis = yield* db
				.select()
				.from(diagnoses)
				.where(eq(diagnoses.id, result.diagnosisId))
				.limit(1);

			expect(savedDiagnosis).toHaveLength(1);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
