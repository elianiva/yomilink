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

import { getPeerStats, submitControlText } from "./learner-map-service";

describe("learner-map-service > getPeerStats", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return empty stats when no peer submissions", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* getPeerStats(student.id, {
				assignmentId: "any-assignment",
			});

			expect(result.count).toBe(0);
			expect(result.avgScore).toBeNull();
			expect(result.userPercentile).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should calculate peer statistics correctly", () =>
		Effect.gen(function* () {
			const db = yield* Database;
			const teacher = yield* createTestUser({ email: "teacher@test.com" });
			const student = yield* createTestUser({
				email: "student@test.com",
				role: "student",
			});
			const peer1 = yield* createTestUser({
				email: "peer1@test.com",
				role: "student",
			});
			const peer2 = yield* createTestUser({
				email: "peer2@test.com",
				role: "student",
			});

			const goalMap = yield* createTestGoalMap(teacher.id);
			const kit = yield* createTestKit(goalMap.id, teacher.id);
			const assignment = yield* createTestAssignment(
				teacher.id,
				goalMap.id,
				kit.id,
			);

			for (const [userId, score] of [
				[peer1.id, 0.6],
				[peer2.id, 0.8],
				[student.id, 0.7],
			] as const) {
				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});
				yield* db.insert(diagnoses).values({
					id: crypto.randomUUID(),
					goalMapId: goalMap.id,
					learnerMapId,
					score,
					rubricVersion: "1.0",
				});
			}

			const result = yield* getPeerStats(student.id, {
				assignmentId: assignment.id,
			});

			expect(result.count).toBe(2);
			expect(result.avgScore).toBe(0.7);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("learner-map-service > submitControlText", () => {
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

			return { assignment, student };
		});

	it("should return error for non-existent assignment", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* Effect.either(
				submitControlText(student.id, {
					assignmentId: "non-existent",
					text: "This is my control text submission.",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("AssignmentNotFoundError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should create new learner map with control text", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment();

			const controlText = "This is my control group text submission.";

			const result = yield* submitControlText(student.id, {
				assignmentId: assignment.id,
				text: controlText,
			});

			expect(result).toBe(true);

			const db = yield* Database;
			const saved = yield* db.select().from(learnerMaps).limit(1);

			expect(saved).toHaveLength(1);
			expect(saved[0]?.controlText).toBe(controlText);
			expect(saved[0]?.status).toBe("submitted");
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return error if already submitted", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment();

			const db = yield* Database;
			yield* db.insert(learnerMaps).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				goalMapId: assignment.goalMapId,
				kitId: assignment.kitId,
				userId: student.id,
				nodes: [],
				edges: [],
				controlText: "Already submitted text.",
				status: "submitted",
				attempt: 1,
				submittedAt: new Date(),
			});

			const result = yield* Effect.either(
				submitControlText(student.id, {
					assignmentId: assignment.id,
					text: "Trying to submit again.",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("LearnerMapAlreadySubmittedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
