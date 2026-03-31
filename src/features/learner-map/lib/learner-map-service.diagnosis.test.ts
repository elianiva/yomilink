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

import {
	getAssignmentForStudent,
	getDiagnosis,
	startNewAttempt,
} from "./learner-map-service";

describe("learner-map-service > getDiagnosis", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return null when no learner map exists", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* getDiagnosis(student.id, {
				assignmentId: "non-existent",
			});

			expect(result).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return learner map without diagnosis if not submitted", () =>
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

			const result = yield* getDiagnosis(student.id, {
				assignmentId: assignment.id,
			});

			expect(result).not.toBeNull();
			expect(result?.learnerMap.status).toBe("draft");
			expect(result?.diagnosis).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("learner-map-service > startNewAttempt", () => {
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

	it("should return error when no previous attempt exists", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* Effect.either(
				startNewAttempt(student.id, {
					assignmentId: "non-existent",
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("NoPreviousAttemptError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return error when previous attempt not submitted", () =>
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
				status: "draft",
				attempt: 1,
			});

			const result = yield* Effect.either(
				startNewAttempt(student.id, {
					assignmentId: assignment.id,
				}),
			);

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left._tag).toBe("PreviousAttemptNotSubmittedError");
			}
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should start new attempt after submission", () =>
		Effect.gen(function* () {
			const { assignment, student } = yield* setupStudentAssignment();

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
				status: "submitted",
				attempt: 1,
				submittedAt: new Date(),
			});

			const result = yield* startNewAttempt(student.id, {
				assignmentId: assignment.id,
			});

			expect(result).toBe(true);

			const updated = yield* db
				.select()
				.from(learnerMaps)
				.where(eq(learnerMaps.id, learnerMapId))
				.limit(1);

			expect(updated[0]?.status).toBe("draft");
			expect(updated[0]?.attempt).toBe(2);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});

describe("learner-map-service > getAssignmentForStudent", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	it("should return null for non-existent assignment", () =>
		Effect.gen(function* () {
			const student = yield* createTestUser({ role: "student" });

			const result = yield* getAssignmentForStudent(student.id, {
				assignmentId: "non-existent",
			});

			expect(result).toBeNull();
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

	it("should return assignment with kit data", () =>
		Effect.gen(function* () {
			const db = yield* Database;
			const teacher = yield* createTestUser({ email: "teacher@test.com" });
			const student = yield* createTestUser({
				email: "student@test.com",
				role: "student",
			});

			const goalMap = yield* createTestGoalMap(teacher.id);
			const kit = yield* createTestKit(goalMap.id, teacher.id, {
				nodes: [{ id: "node1", data: {}, position: { x: 0, y: 0 } }],
				edges: [],
			});
			const assignment = yield* createTestAssignment(
				teacher.id,
				goalMap.id,
				kit.id,
				{
					title: "Test Assignment",
					description: "Test Description",
				},
			);

			yield* db.insert(assignmentTargets).values({
				id: crypto.randomUUID(),
				assignmentId: assignment.id,
				userId: student.id,
			});

			const result = yield* getAssignmentForStudent(student.id, {
				assignmentId: assignment.id,
			});

			expect(result).not.toBeNull();
			expect(result?.assignment.title).toBe("Test Assignment");
			expect(result?.kit.id).toBe(kit.id);
		}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
});
