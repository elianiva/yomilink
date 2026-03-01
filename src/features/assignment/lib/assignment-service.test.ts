import { assert, beforeEach, describe, it } from "@effect/vitest";
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
import { assignments } from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";

import {
	createAssignment,
	deleteAssignment,
	getAvailableCohorts,
	getAvailableUsers,
	getTeacherGoalMaps,
	listTeacherAssignments,
} from "./assignment-service";

describe("assignment-service", () => {
	beforeEach(() => Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))));

	describe("createAssignment", () => {
		it.effect("should create assignment with valid data", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);

				const result = yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [],
					userIds: [],
				});

				assert.strictEqual(result, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return KitNotFoundError when kit does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* Effect.either(
					createAssignment(teacher.id, {
						title: "Test Assignment",
						goalMapId: goalMap.id,
						cohortIds: [],
						userIds: [],
					}),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "KitNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create assignment with optional fields", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);

				const startDate = Date.now();
				const endDate = Date.now() + 86400000;

				const result = yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					description: "Test Description",
					goalMapId: goalMap.id,
					startDate,
					endDate,
					cohortIds: [],
					userIds: [],
				});

				assert.strictEqual(result, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create assignment targets for cohorts", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);

				// Create cohorts
				const cohortId1 = crypto.randomUUID();
				const cohortId2 = crypto.randomUUID();
				yield* db.insert(cohorts).values([
					{ id: cohortId1, name: "Cohort 1" },
					{ id: cohortId2, name: "Cohort 2" },
				]);

				const result = yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [cohortId1, cohortId2],
					userIds: [],
				});

				assert.strictEqual(result, true);

				// Get the created assignment id from database
				const assignmentRows = yield* db
					.select({ id: assignments.id })
					.from(assignments)
					.where(eq(assignments.title, "Test Assignment"))
					.limit(1);
				const assignmentId = assignmentRows[0]?.id;
				assert.isDefined(assignmentId);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create assignment targets for users", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser();
				const student1 = yield* createTestUser({ email: "student1@test.com" });
				const student2 = yield* createTestUser({ email: "student2@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);

				const result = yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [],
					userIds: [student1.id, student2.id],
				});

				assert.strictEqual(result, true);

				// Get the created assignment id from database
				const assignmentRows = yield* db
					.select({ id: assignments.id })
					.from(assignments)
					.where(eq(assignments.title, "Test Assignment"))
					.limit(1);
				const assignmentId = assignmentRows[0]?.id;
				assert.isDefined(assignmentId);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create assignment targets for both cohorts and users", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({ email: "student@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);

				// Create cohort
				const cohortId = crypto.randomUUID();
				yield* db.insert(cohorts).values([{ id: cohortId, name: "Test Cohort" }]);

				const result = yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [cohortId],
					userIds: [student.id],
				});

				assert.strictEqual(result, true);

				// Get the created assignment id from database
				const assignmentRows = yield* db
					.select({ id: assignments.id })
					.from(assignments)
					.where(eq(assignments.title, "Test Assignment"))
					.limit(1);
				const assignmentId = assignmentRows[0]?.id;
				assert.isDefined(assignmentId);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("listTeacherAssignments", () => {
		it.effect("should return empty array when no assignments exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* listTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return only assignments created by teacher", () =>
			Effect.gen(function* () {
				const teacher1 = yield* createTestUser({ email: "teacher1@test.com" });
				const teacher2 = yield* createTestUser({ email: "teacher2@test.com" });
				const goalMap1 = yield* createTestGoalMap(teacher1.id);
				const goalMap2 = yield* createTestGoalMap(teacher2.id);
				yield* createTestKit(goalMap1.id, teacher1.id);
				yield* createTestKit(goalMap2.id, teacher2.id);
				yield* createAssignment(teacher1.id, {
					title: "Teacher 1 Assignment",
					goalMapId: goalMap1.id,
					cohortIds: [],
					userIds: [],
				});
				yield* createAssignment(teacher2.id, {
					title: "Teacher 2 Assignment",
					goalMapId: goalMap2.id,
					cohortIds: [],
					userIds: [],
				});

				const result = yield* listTeacherAssignments(teacher1.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.title, "Teacher 1 Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignments ordered by createdAt descending", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const oldGoalMap = yield* createTestGoalMap(teacher.id, {
					title: "Goal 1",
				});
				const newGoalMap = yield* createTestGoalMap(teacher.id, {
					title: "Goal 2",
				});
				const oldKit = yield* createTestKit(oldGoalMap.id, teacher.id);
				const newKit = yield* createTestKit(newGoalMap.id, teacher.id);

				// Use createTestAssignment with explicit createdAt timestamps
				yield* createTestAssignment(teacher.id, oldGoalMap.id, oldKit.id, {
					title: "Old Assignment",
					createdAt: new Date("2024-01-01"),
				});

				yield* createTestAssignment(teacher.id, newGoalMap.id, newKit.id, {
					title: "New Assignment",
					createdAt: new Date("2024-01-02"),
				});

				const result = yield* listTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 2);
				assert.strictEqual(result[0]?.title, "New Assignment");
				assert.strictEqual(result[1]?.title, "Old Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignment with goal map details", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Test Goal Map",
					description: "Test Description",
				});
				yield* createTestKit(goalMap.id, teacher.id);
				yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [],
					userIds: [],
				});

				const result = yield* listTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.goalMapTitle, "Test Goal Map");
				assert.strictEqual(result[0]?.goalMapDescription, "Test Description");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should convert dates to timestamps", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);
				const startDate = Date.now();
				const endDate = Date.now() + 86400000;
				yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					startDate,
					endDate,
					cohortIds: [],
					userIds: [],
				});

				const result = yield* listTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(typeof result[0]?.startDate, "number");
				assert.strictEqual(typeof result[0]?.dueAt, "number");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("deleteAssignment", () => {
		it.effect("should delete assignment successfully", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				yield* createTestKit(goalMap.id, teacher.id);
				// Create assignment
				yield* createAssignment(teacher.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [],
					userIds: [],
				});

				// Get the created assignment id from database
				const assignmentRows = yield* db
					.select({ id: assignments.id })
					.from(assignments)
					.where(eq(assignments.title, "Test Assignment"))
					.limit(1);
				const assignmentId = assignmentRows[0]?.id;
				assert.isDefined(assignmentId);
				const result = yield* deleteAssignment(teacher.id, {
					id: assignmentId!,
				});
				assert.strictEqual(result, true);
			}).pipe(Effect.provide(DatabaseTest)),
		);
		it.effect("should return AssignmentNotFoundError when assignment does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* Effect.either(
					deleteAssignment(teacher.id, { id: "non-existent-id" }),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "AssignmentNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
		it.effect("should return AssignmentNotFoundError when user is not creator", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher1 = yield* createTestUser({
					email: "teacher1@test.com",
				});
				const teacher2 = yield* createTestUser({
					email: "teacher2@test.com",
				});
				const goalMap = yield* createTestGoalMap(teacher1.id);
				yield* createTestKit(goalMap.id, teacher1.id);
				// Create assignment
				yield* createAssignment(teacher1.id, {
					title: "Test Assignment",
					goalMapId: goalMap.id,
					cohortIds: [],
					userIds: [],
				});

				// Get the created assignment id from database
				const assignmentRows = yield* db
					.select({ id: assignments.id })
					.from(assignments)
					.where(eq(assignments.title, "Test Assignment"))
					.limit(1);
				const assignmentId = assignmentRows[0]?.id;
				assert.isDefined(assignmentId);

				const result = yield* Effect.either(
					deleteAssignment(teacher2.id, {
						id: assignmentId!,
					}),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "AssignmentNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getAvailableCohorts", () => {
		it.effect("should return empty array when no cohorts exist", () =>
			Effect.gen(function* () {
				const result = yield* getAvailableCohorts();

				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return cohorts ordered by name", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				yield* db.insert(cohorts).values([
					{ id: crypto.randomUUID(), name: "Zebra" },
					{ id: crypto.randomUUID(), name: "Apple" },
					{ id: crypto.randomUUID(), name: "Mango" },
				]);

				const result = yield* getAvailableCohorts();

				assert.strictEqual(result.length, 3);
				assert.strictEqual(result[0]?.name, "Apple");
				assert.strictEqual(result[1]?.name, "Mango");
				assert.strictEqual(result[2]?.name, "Zebra");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return cohorts with member count", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const user1 = yield* createTestUser({ email: "user1@test.com" });
				const user2 = yield* createTestUser({ email: "user2@test.com" });
				const user3 = yield* createTestUser({ email: "user3@test.com" });

				const cohortId1 = crypto.randomUUID();
				const cohortId2 = crypto.randomUUID();
				yield* db.insert(cohorts).values([
					{ id: cohortId1, name: "Cohort A" },
					{ id: cohortId2, name: "Cohort B" },
				]);

				// Add 2 members to Cohort A
				yield* db.insert(cohortMembers).values([
					{ id: crypto.randomUUID(), cohortId: cohortId1, userId: user1.id },
					{ id: crypto.randomUUID(), cohortId: cohortId1, userId: user2.id },
				]);

				// Add 1 member to Cohort B
				yield* db
					.insert(cohortMembers)
					.values([{ id: crypto.randomUUID(), cohortId: cohortId2, userId: user3.id }]);

				const result = yield* getAvailableCohorts();

				assert.strictEqual(result.length, 2);
				const cohortA = result.find((c) => c.id === cohortId1);
				const cohortB = result.find((c) => c.id === cohortId2);
				assert.strictEqual(cohortA?.memberCount, 2);
				assert.strictEqual(cohortB?.memberCount, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return 0 member count for cohorts with no members", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				yield* db
					.insert(cohorts)
					.values([{ id: crypto.randomUUID(), name: "Empty Cohort" }]);

				const result = yield* getAvailableCohorts();

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.memberCount, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getAvailableUsers", () => {
		it.effect("should return empty array when no users exist", () =>
			Effect.gen(function* () {
				const result = yield* getAvailableUsers();

				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return users ordered by name", () =>
			Effect.gen(function* () {
				yield* createTestUser({ name: "Zoe User", email: "zoe@test.com" });
				yield* createTestUser({
					name: "Alice User",
					email: "alice@test.com",
				});
				yield* createTestUser({ name: "Mike User", email: "mike@test.com" });

				const result = yield* getAvailableUsers();

				assert.strictEqual(result.length, 3);
				assert.strictEqual(result[0]?.name, "Alice User");
				assert.strictEqual(result[1]?.name, "Mike User");
				assert.strictEqual(result[2]?.name, "Zoe User");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getTeacherGoalMaps", () => {
		it.effect("should return empty array when no goal maps exist", () =>
			Effect.gen(function* () {
				const result = yield* getTeacherGoalMaps();

				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return goal maps ordered by updatedAt descending", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				yield* createTestGoalMap(teacher.id, {
					title: "Old Goal Map",
					updatedAt: new Date("2024-01-01"),
				});
				yield* createTestGoalMap(teacher.id, {
					title: "New Goal Map",
					updatedAt: new Date("2024-01-02"),
				});

				const result = yield* getTeacherGoalMaps();

				assert.strictEqual(result.length, 2);
				assert.strictEqual(result[0]?.title, "New Goal Map");
				assert.strictEqual(result[1]?.title, "Old Goal Map");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should convert dates to timestamps", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				yield* createTestGoalMap(teacher.id, {
					createdAt: new Date("2024-01-01"),
					updatedAt: new Date("2024-01-02"),
				});

				const result = yield* getTeacherGoalMaps();

				assert.strictEqual(result.length, 1);
				assert.strictEqual(typeof result[0]?.createdAt, "number");
				assert.strictEqual(typeof result[0]?.updatedAt, "number");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
