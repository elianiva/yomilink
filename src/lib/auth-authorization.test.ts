import { assert, beforeEach, describe, it } from "@effect/vitest";
import { Effect, Either } from "effect";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";
import { assignmentTargets } from "@/server/db/schema/app-schema";
import {
	createTestAssignment,
	createTestGoalMap,
	createTestKit,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import {
	canAccessAssignment,
	canAccessGoalMap,
	isGoalMapOwner,
	isRole,
	requireAnyRole,
	requireGoalMapAccess,
	requireGoalMapOwner,
	requireRole,
} from "./auth-authorization";

describe("auth-authorization", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	describe("isGoalMapOwner", () => {
		it.effect("should return true when user is the goal map owner", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* isGoalMapOwner(teacher.id, goalMap.id);

				assert.isTrue(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return false when user is not the goal map owner", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const otherUser = yield* createTestUser({ email: "other@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* isGoalMapOwner(otherUser.id, goalMap.id);

				assert.isFalse(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle non-existent goal map appropriately", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* Effect.either(
					isGoalMapOwner(user.id, "non-existent-id"),
				);

				// Should either fail with GoalMapNotFoundError or return false
				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "GoalMapNotFoundError"),
					onRight: (value) => assert.isFalse(value),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("canAccessGoalMap", () => {
		it.effect(
			"should return true when user is the goal map owner (direct ownership)",
			() =>
				Effect.gen(function* () {
					const teacher = yield* createTestUser();
					const goalMap = yield* createTestGoalMap(teacher.id);

					const result = yield* canAccessGoalMap(teacher.id, goalMap.id);

					assert.isTrue(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return true when user has direct assignment target access",
			() =>
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

					const result = yield* canAccessGoalMap(student.id, goalMap.id);

					assert.isTrue(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return true when user is in a cohort targeted by assignment",
			() =>
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

					const cohortId = crypto.randomUUID();
					yield* db
						.insert(cohorts)
						.values({ id: cohortId, name: "Test Cohort" });
					yield* db.insert(cohortMembers).values({
						id: crypto.randomUUID(),
						cohortId,
						userId: student.id,
					});

					yield* db.insert(assignmentTargets).values({
						id: crypto.randomUUID(),
						assignmentId: assignment.id,
						cohortId,
					});

					const result = yield* canAccessGoalMap(student.id, goalMap.id);

					assert.isTrue(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return false when user has no access", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const unauthorizedUser = yield* createTestUser({
					email: "unauthorized@test.com",
				});
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* canAccessGoalMap(unauthorizedUser.id, goalMap.id);

				assert.isFalse(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return false when user is in cohort but cohort is not targeted",
			() =>
				Effect.gen(function* () {
					const db = yield* Database;
					const teacher = yield* createTestUser({ email: "teacher@test.com" });
					const student = yield* createTestUser({
						email: "student@test.com",
						role: "student",
					});
					const goalMap = yield* createTestGoalMap(teacher.id);

					const cohortId = crypto.randomUUID();
					yield* db
						.insert(cohorts)
						.values({ id: cohortId, name: "Test Cohort" });
					yield* db.insert(cohortMembers).values({
						id: crypto.randomUUID(),
						cohortId,
						userId: student.id,
					});

					const result = yield* canAccessGoalMap(student.id, goalMap.id);

					assert.isFalse(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle non-existent goal map appropriately", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* Effect.either(
					canAccessGoalMap(user.id, "non-existent-id"),
				);

				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "GoalMapNotFoundError"),
					onRight: (value) => assert.isFalse(value),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return false when user is in different cohort than assigned",
			() =>
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

					const cohortA = crypto.randomUUID();
					const cohortB = crypto.randomUUID();
					yield* db.insert(cohorts).values([
						{ id: cohortA, name: "Cohort A" },
						{ id: cohortB, name: "Cohort B" },
					]);

					yield* db.insert(cohortMembers).values({
						id: crypto.randomUUID(),
						cohortId: cohortA,
						userId: student.id,
					});

					yield* db.insert(assignmentTargets).values({
						id: crypto.randomUUID(),
						assignmentId: assignment.id,
						cohortId: cohortB,
					});

					const result = yield* canAccessGoalMap(student.id, goalMap.id);

					assert.isFalse(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("canAccessAssignment", () => {
		it.effect("should return true when user is the assignment creator", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				const result = yield* canAccessAssignment(teacher.id, assignment.id);

				assert.isTrue(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return true when user has direct assignment target", () =>
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

				const result = yield* canAccessAssignment(student.id, assignment.id);

				assert.isTrue(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return true when user is in a targeted cohort", () =>
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

				const cohortId = crypto.randomUUID();
				yield* db.insert(cohorts).values({ id: cohortId, name: "Test Cohort" });
				yield* db.insert(cohortMembers).values({
					id: crypto.randomUUID(),
					cohortId,
					userId: student.id,
				});

				yield* db.insert(assignmentTargets).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					cohortId,
				});

				const result = yield* canAccessAssignment(student.id, assignment.id);

				assert.isTrue(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return false when user has no access to assignment", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const unauthorizedUser = yield* createTestUser({
					email: "unauthorized@test.com",
				});
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				const result = yield* canAccessAssignment(
					unauthorizedUser.id,
					assignment.id,
				);

				assert.isFalse(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle non-existent assignment appropriately", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* Effect.either(
					canAccessAssignment(user.id, "non-existent-id"),
				);

				Either.match(result, {
					onLeft: (error) =>
						assert.strictEqual(error._tag, "AssignmentNotFoundError"),
					onRight: (value) => assert.isFalse(value),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return false when user is in different cohort than assigned",
			() =>
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

					const studentCohort = crypto.randomUUID();
					const assignedCohort = crypto.randomUUID();
					yield* db.insert(cohorts).values([
						{ id: studentCohort, name: "Student Cohort" },
						{ id: assignedCohort, name: "Assigned Cohort" },
					]);

					yield* db.insert(cohortMembers).values({
						id: crypto.randomUUID(),
						cohortId: studentCohort,
						userId: student.id,
					});

					yield* db.insert(assignmentTargets).values({
						id: crypto.randomUUID(),
						assignmentId: assignment.id,
						cohortId: assignedCohort,
					});

					const result = yield* canAccessAssignment(student.id, assignment.id);

					assert.isFalse(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle mixed cohort and user targets correctly", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student1 = yield* createTestUser({
					email: "student1@test.com",
					role: "student",
				});
				const student2 = yield* createTestUser({
					email: "student2@test.com",
					role: "student",
				});
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				const cohortId = crypto.randomUUID();
				yield* db.insert(cohorts).values({ id: cohortId, name: "Test Cohort" });
				yield* db.insert(cohortMembers).values({
					id: crypto.randomUUID(),
					cohortId,
					userId: student2.id,
				});

				yield* db.insert(assignmentTargets).values([
					{
						id: crypto.randomUUID(),
						assignmentId: assignment.id,
						userId: student1.id,
					},
					{
						id: crypto.randomUUID(),
						assignmentId: assignment.id,
						cohortId,
					},
				]);

				const result1 = yield* canAccessAssignment(student1.id, assignment.id);
				assert.isTrue(result1);

				const result2 = yield* canAccessAssignment(student2.id, assignment.id);
				assert.isTrue(result2);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("isRole", () => {
		it.effect("should return true when user has the specified role", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser({ role: "teacher" });

				const result = yield* isRole(teacher.id, "teacher");

				assert.isTrue(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return false when user does not have the specified role",
			() =>
				Effect.gen(function* () {
					const student = yield* createTestUser({ role: "student" });

					const result = yield* isRole(student.id, "teacher");

					assert.isFalse(result);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return false when user has no role", () =>
			Effect.gen(function* () {
				const userWithNoRole = yield* createTestUser({ role: null });

				const result = yield* isRole(userWithNoRole.id, "teacher");

				assert.isFalse(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return false when user does not exist", () =>
			Effect.gen(function* () {
				const result = yield* isRole("non-existent-user-id", "teacher");

				assert.isFalse(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle admin role correctly", () =>
			Effect.gen(function* () {
				const admin = yield* createTestUser({ role: "admin" });

				const isAdmin = yield* isRole(admin.id, "admin");
				const isTeacher = yield* isRole(admin.id, "teacher");

				assert.isTrue(isAdmin);
				assert.isFalse(isTeacher);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("requireRole", () => {
		it.effect("should return userId when user has the required role", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser({ role: "teacher" });

				const result = yield* requireRole("teacher")(teacher.id);

				assert.strictEqual(result, teacher.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return ForbiddenError when user does not have the required role",
			() =>
				Effect.gen(function* () {
					const student = yield* createTestUser({ role: "student" });

					const result = yield* Effect.either(
						requireRole("teacher")(student.id),
					);

					Either.match(result, {
						onLeft: (error) => {
							assert.strictEqual(error._tag, "ForbiddenError");
							assert.include(error.message, "teacher");
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return ForbiddenError when user has no role", () =>
			Effect.gen(function* () {
				const userWithNoRole = yield* createTestUser({ role: null });

				const result = yield* Effect.either(
					requireRole("teacher")(userWithNoRole.id),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "ForbiddenError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("requireAnyRole", () => {
		it.effect(
			"should return userId when user has one of the required roles",
			() =>
				Effect.gen(function* () {
					const teacher = yield* createTestUser({ role: "teacher" });

					const result = yield* requireAnyRole("teacher", "admin")(teacher.id);

					assert.strictEqual(result, teacher.id);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return userId when user has the second role in the list",
			() =>
				Effect.gen(function* () {
					const admin = yield* createTestUser({ role: "admin" });

					const result = yield* requireAnyRole("teacher", "admin")(admin.id);

					assert.strictEqual(result, admin.id);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return ForbiddenError when user has none of the required roles",
			() =>
				Effect.gen(function* () {
					const student = yield* createTestUser({ role: "student" });

					const result = yield* Effect.either(
						requireAnyRole("teacher", "admin")(student.id),
					);

					Either.match(result, {
						onLeft: (error) => {
							assert.strictEqual(error._tag, "ForbiddenError");
							assert.include(error.message, "teacher");
							assert.include(error.message, "admin");
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return ForbiddenError when user has no role", () =>
			Effect.gen(function* () {
				const userWithNoRole = yield* createTestUser({ role: null });

				const result = yield* Effect.either(
					requireAnyRole("teacher", "admin")(userWithNoRole.id),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "ForbiddenError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return ForbiddenError when user does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(
					requireAnyRole("teacher", "admin")("non-existent-id"),
				);

				Either.match(result, {
					onLeft: (error) => assert.strictEqual(error._tag, "ForbiddenError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should work with a single role", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser({ role: "teacher" });

				const result = yield* requireAnyRole("teacher")(teacher.id);

				assert.strictEqual(result, teacher.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should work with multiple roles (more than 2)", () =>
			Effect.gen(function* () {
				const moderator = yield* createTestUser({ role: "moderator" });

				const result = yield* requireAnyRole(
					"teacher",
					"admin",
					"moderator",
				)(moderator.id);

				assert.strictEqual(result, moderator.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("requireGoalMapOwner", () => {
		it.effect("should return userId when user is the goal map owner", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* requireGoalMapOwner(teacher.id, goalMap.id);

				assert.strictEqual(result, teacher.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return ForbiddenError when user is not the goal map owner",
			() =>
				Effect.gen(function* () {
					const teacher = yield* createTestUser({ email: "teacher@test.com" });
					const otherUser = yield* createTestUser({ email: "other@test.com" });
					const goalMap = yield* createTestGoalMap(teacher.id);

					const result = yield* Effect.either(
						requireGoalMapOwner(otherUser.id, goalMap.id),
					);

					Either.match(result, {
						onLeft: (error) => {
							assert.strictEqual(error._tag, "ForbiddenError");
							assert.include(error.message, "owner");
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should fail when goal map does not exist", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* Effect.either(
					requireGoalMapOwner(user.id, "non-existent-id"),
				);

				// Should fail with either GoalMapNotFoundError or ForbiddenError
				Either.match(result, {
					onLeft: (error) =>
						assert.isTrue(
							error._tag === "ForbiddenError" ||
								error._tag === "GoalMapNotFoundError",
						),
					onRight: () => assert.fail("Expected an error but got success"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("requireGoalMapAccess", () => {
		it.effect("should return userId when user has access to goal map", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);

				const result = yield* requireGoalMapAccess(teacher.id, goalMap.id);

				assert.strictEqual(result, teacher.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return userId when user has access via assignment target",
			() =>
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

					const result = yield* requireGoalMapAccess(student.id, goalMap.id);

					assert.strictEqual(result, student.id);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return ForbiddenError when user has no access to goal map",
			() =>
				Effect.gen(function* () {
					const teacher = yield* createTestUser({ email: "teacher@test.com" });
					const unauthorizedUser = yield* createTestUser({
						email: "unauthorized@test.com",
					});
					const goalMap = yield* createTestGoalMap(teacher.id);

					const result = yield* Effect.either(
						requireGoalMapAccess(unauthorizedUser.id, goalMap.id),
					);

					Either.match(result, {
						onLeft: (error) => {
							assert.strictEqual(error._tag, "ForbiddenError");
							assert.include(error.message, "access");
						},
						onRight: () => assert.fail("Expected Left but got Right"),
					});
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should fail when goal map does not exist", () =>
			Effect.gen(function* () {
				const user = yield* createTestUser();

				const result = yield* Effect.either(
					requireGoalMapAccess(user.id, "non-existent-id"),
				);

				// Should fail with either GoalMapNotFoundError or ForbiddenError
				Either.match(result, {
					onLeft: (error) =>
						assert.isTrue(
							error._tag === "ForbiddenError" ||
								error._tag === "GoalMapNotFoundError",
						),
					onRight: () => assert.fail("Expected an error but got success"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
