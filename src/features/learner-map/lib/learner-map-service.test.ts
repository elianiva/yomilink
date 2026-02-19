import { assert, beforeEach, describe, it } from "@effect/vitest";
import { eq } from "drizzle-orm";
import { Effect } from "effect";
import {
	createTestAssignment,
	createTestGoalMap,
	createTestKit,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { Database, DatabaseTest } from "@/server/db/client";
import {
	assignmentTargets,
	diagnoses,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";
import {
	getAssignmentForStudent,
	getDiagnosis,
	getPeerStats,
	listStudentAssignments,
	saveLearnerMap,
	startNewAttempt,
	submitControlText,
	submitLearnerMap,
} from "./learner-map-service";

describe("learner-map-service", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	describe("listStudentAssignments", () => {
		it.effect("should return empty array when no assignments exist", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* listStudentAssignments(student.id);

				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignments targeted to user directly", () =>
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

				// Target assignment to student directly
				yield* db.insert(assignmentTargets).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					userId: student.id,
				});

				const result = yield* listStudentAssignments(student.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.title, "Test Assignment");
				assert.strictEqual(result[0]?.status, "not_started");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignments targeted to user's cohort", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				// Create cohort and add student
				const cohortId = crypto.randomUUID();
				yield* db.insert(cohorts).values({ id: cohortId, name: "Class A" });
				yield* db.insert(cohortMembers).values({
					id: crypto.randomUUID(),
					cohortId,
					userId: student.id,
				});

				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
					{ title: "Cohort Assignment" },
				);

				// Target assignment to cohort
				yield* db.insert(assignmentTargets).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					cohortId,
				});

				const result = yield* listStudentAssignments(student.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.title, "Cohort Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return learner map status when student has started", () =>
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

				// Create learner map (student has started)
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

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.status, "draft");
				assert.strictEqual(result[0]?.attempt, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should identify late assignments", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);

				// Create assignment with past due date
				const pastDue = new Date(Date.now() - 86400000); // 1 day ago
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

				assert.strictEqual(result.length, 1);
				assert.isTrue(result[0]?.isLate);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should not mark submitted assignments as late", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);

				// Create assignment with past due date
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

				// Create submitted learner map
				yield* db.insert(learnerMaps).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});

				const result = yield* listStudentAssignments(student.id);

				assert.strictEqual(result.length, 1);
				assert.isFalse(result[0]?.isLate);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignments ordered by createdAt descending", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				const goalMap1 = yield* createTestGoalMap(teacher.id);
				const goalMap2 = yield* createTestGoalMap(teacher.id);
				const kit1 = yield* createTestKit(goalMap1.id, teacher.id);
				const kit2 = yield* createTestKit(goalMap2.id, teacher.id);

				const oldAssignment = yield* createTestAssignment(
					teacher.id,
					goalMap1.id,
					kit1.id,
					{ title: "Old Assignment", createdAt: new Date("2024-01-01") },
				);

				const newAssignment = yield* createTestAssignment(
					teacher.id,
					goalMap2.id,
					kit2.id,
					{ title: "New Assignment", createdAt: new Date("2024-01-02") },
				);

				yield* db.insert(assignmentTargets).values([
					{
						id: crypto.randomUUID(),
						assignmentId: oldAssignment.id,
						userId: student.id,
					},
					{
						id: crypto.randomUUID(),
						assignmentId: newAssignment.id,
						userId: student.id,
					},
				]);

				const result = yield* listStudentAssignments(student.id);

				assert.strictEqual(result.length, 2);
				assert.strictEqual(result[0]?.title, "New Assignment");
				assert.strictEqual(result[1]?.title, "Old Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getAssignmentForStudent", () => {
		it.effect("should return null for non-existent assignment", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* getAssignmentForStudent(student.id, {
					assignmentId: "non-existent",
				});

				assert.isNull(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignment with kit data", () =>
			Effect.gen(function* () {
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
					{ title: "Test Assignment", description: "Test Description" },
				);

				const result = yield* getAssignmentForStudent(student.id, {
					assignmentId: assignment.id,
				});

				assert.isNotNull(result);
				assert.strictEqual(result?.assignment.title, "Test Assignment");
				assert.strictEqual(result?.assignment.description, "Test Description");
				assert.strictEqual(result?.kit.id, kit.id);
				assert.strictEqual(result?.kit.nodes.length, 1);
				assert.isNull(result?.learnerMap);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return existing learner map if student has started", () =>
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

				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: [{ id: "n1", data: {}, position: { x: 0, y: 0 } }],
					edges: [],
					status: "draft",
					attempt: 2,
				});

				const result = yield* getAssignmentForStudent(student.id, {
					assignmentId: assignment.id,
				});

				assert.isNotNull(result?.learnerMap);
				assert.strictEqual(result?.learnerMap?.id, learnerMapId);
				assert.strictEqual(result?.learnerMap?.status, "draft");
				assert.strictEqual(result?.learnerMap?.attempt, 2);
				assert.strictEqual(result?.learnerMap?.nodes.length, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should use reading material from assignment if set", () =>
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
					{ readingMaterial: "Custom reading material" },
				);

				const result = yield* getAssignmentForStudent(student.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result?.materialText, "Custom reading material");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("saveLearnerMap", () => {
		it.effect("should return error for non-existent assignment", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* saveLearnerMap(student.id, {
					assignmentId: "non-existent",
					nodes: "[]",
					edges: "[]",
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Assignment not found");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create new learner map on first save", () =>
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

				const nodes = JSON.stringify([
					{ id: "n1", data: {}, position: { x: 0, y: 0 } },
				]);
				const edges = JSON.stringify([
					{ id: "e1", source: "n1", target: "n2" },
				]);

				const result = yield* saveLearnerMap(student.id, {
					assignmentId: assignment.id,
					nodes,
					edges,
				});

				assert.isTrue(result.success);
				assert.isDefined(result.learnerMapId);

				// Verify in database
				assert.isDefined(result.learnerMapId);
				const saved = yield* db
					.select()
					.from(learnerMaps)
					.where(eq(learnerMaps.id, result.learnerMapId ?? ""))
					.limit(1);

				assert.strictEqual(saved.length, 1);
				assert.strictEqual(saved[0]?.status, "draft");
				assert.strictEqual(saved[0]?.attempt, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should update existing learner map", () =>
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

				// Create initial learner map
				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "draft",
					attempt: 1,
				});

				const newNodes = JSON.stringify([
					{ id: "updated", data: {}, position: { x: 0, y: 0 } },
				]);
				const newEdges = JSON.stringify([
					{ id: "e1", source: "a", target: "b" },
				]);

				const result = yield* saveLearnerMap(student.id, {
					assignmentId: assignment.id,
					nodes: newNodes,
					edges: newEdges,
				});

				assert.isTrue(result.success);
				assert.strictEqual(result.learnerMapId, learnerMapId);

				// Verify update
				const updated = yield* db
					.select()
					.from(learnerMaps)
					.where(eq(learnerMaps.id, learnerMapId))
					.limit(1);

				assert.strictEqual(updated[0]?.nodes, newNodes);
				assert.strictEqual(updated[0]?.edges, newEdges);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should not allow editing submitted map", () =>
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

				// Create submitted learner map
				yield* db.insert(learnerMaps).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});

				const result = yield* saveLearnerMap(student.id, {
					assignmentId: assignment.id,
					nodes: "[]",
					edges: "[]",
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Cannot edit submitted map");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("submitLearnerMap", () => {
		it.effect("should return error when learner map does not exist", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* submitLearnerMap(student.id, {
					assignmentId: "non-existent",
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Learner map not found");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return error for already submitted map", () =>
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

				yield* db.insert(learnerMaps).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});

				const result = yield* submitLearnerMap(student.id, {
					assignmentId: assignment.id,
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Already submitted");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should submit learner map and create diagnosis", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				// Create goal map with edges
				const goalMap = yield* createTestGoalMap(teacher.id, {
					edges: [
						{ id: "e1", source: "a", target: "link" },
						{ id: "e2", source: "link", target: "b" },
					],
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				// Create learner map with some matching edges
				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: [],
					edges: [
						{ id: "le1", source: "a", target: "link" }, // correct
						{ id: "le2", source: "c", target: "d" }, // excessive
					],
					status: "draft",
					attempt: 1,
				});

				const result = yield* submitLearnerMap(student.id, {
					assignmentId: assignment.id,
				});

				assert.isTrue(result.success);
				assert.isDefined(result.diagnosisId);
				assert.isDefined(result.diagnosis);
				assert.strictEqual(result.diagnosis?.correct.length, 1);
				assert.strictEqual(result.diagnosis?.missing.length, 1);
				assert.strictEqual(result.diagnosis?.excessive.length, 1);
				assert.strictEqual(result.diagnosis?.score, 0.5); // 1/2 correct

				// Verify learner map status updated
				const updated = yield* db
					.select()
					.from(learnerMaps)
					.where(eq(learnerMaps.id, learnerMapId))
					.limit(1);

				assert.strictEqual(updated[0]?.status, "submitted");
				assert.isNotNull(updated[0]?.submittedAt);

				// Verify diagnosis created
				assert.isDefined(result.diagnosisId);
				const savedDiagnosis = yield* db
					.select()
					.from(diagnoses)
					.where(eq(diagnoses.id, result.diagnosisId ?? ""))
					.limit(1);

				assert.strictEqual(savedDiagnosis.length, 1);
				assert.strictEqual(savedDiagnosis[0]?.score, 0.5);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should calculate perfect score for matching maps", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				const goalMap = yield* createTestGoalMap(teacher.id, {
					edges: [
						{ id: "e1", source: "a", target: "b" },
						{ id: "e2", source: "b", target: "c" },
					],
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				// Perfect match
				yield* db.insert(learnerMaps).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: [],
					edges: [
						{ id: "le1", source: "a", target: "b" },
						{ id: "le2", source: "b", target: "c" },
					],
					status: "draft",
					attempt: 1,
				});

				const result = yield* submitLearnerMap(student.id, {
					assignmentId: assignment.id,
				});

				assert.isTrue(result.success);
				assert.strictEqual(result.diagnosis?.score, 1);
				assert.strictEqual(result.diagnosis?.correct.length, 2);
				assert.strictEqual(result.diagnosis?.missing.length, 0);
				assert.strictEqual(result.diagnosis?.excessive.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getDiagnosis", () => {
		it.effect("should return null when no learner map exists", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* getDiagnosis(student.id, {
					assignmentId: "non-existent",
				});

				assert.isNull(result);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect(
			"should return learner map without diagnosis if not submitted",
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

					assert.isNotNull(result);
					assert.strictEqual(result?.learnerMap.status, "draft");
					assert.isNull(result?.diagnosis);
				}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return full diagnosis data after submission", () =>
			Effect.gen(function* () {
				const db = yield* Database;
				const teacher = yield* createTestUser({ email: "teacher@test.com" });
				const student = yield* createTestUser({
					email: "student@test.com",
					role: "student",
				});

				const goalMapNodes = JSON.stringify([
					{ id: "a", data: { label: "A" }, position: { x: 0, y: 0 } },
					{ id: "b", data: { label: "B" }, position: { x: 100, y: 0 } },
				]);
				const goalMapEdges = JSON.stringify([
					{ id: "e1", source: "a", target: "b" },
				]);
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: goalMapNodes,
					edges: goalMapEdges,
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				const learnerMapId = crypto.randomUUID();
				const learnerNodes = JSON.stringify([
					{ id: "a", data: { label: "A" }, position: { x: 0, y: 0 } },
				]);
				const learnerEdges = JSON.stringify([
					{ id: "le1", source: "a", target: "b" },
				]);
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: learnerNodes,
					edges: learnerEdges,
					status: "submitted",
					attempt: 1,
				});

				// Create diagnosis
				const diagnosisData = JSON.stringify({
					correct: [{ source: "a", target: "b", edgeId: "le1" }],
					missing: [],
					excessive: [],
					score: 1,
					totalGoalEdges: 1,
				});
				yield* db.insert(diagnoses).values({
					id: crypto.randomUUID(),
					goalMapId: goalMap.id,
					learnerMapId,
					summary: "Correct: 1, Missing: 0, Excessive: 0",
					perLink: diagnosisData,
					score: 1,
					rubricVersion: "1.0",
				});

				const result = yield* getDiagnosis(student.id, {
					assignmentId: assignment.id,
				});

				assert.isNotNull(result);
				assert.strictEqual(result?.learnerMap.status, "submitted");
				assert.isNotNull(result?.diagnosis);
				assert.strictEqual(result?.diagnosis?.score, 1);
				assert.strictEqual(result?.diagnosis?.correct.length, 1);
				assert.strictEqual(result?.goalMap.nodes.length, 2);
				assert.strictEqual(result?.goalMap.edges.length, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("startNewAttempt", () => {
		it.effect("should return error when no previous attempt exists", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* startNewAttempt(student.id, {
					assignmentId: "non-existent",
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "No previous attempt found");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return error when previous attempt not submitted", () =>
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

				const result = yield* startNewAttempt(student.id, {
					assignmentId: assignment.id,
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Previous attempt not submitted");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should start new attempt after submission", () =>
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

				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
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

				assert.isTrue(result.success);
				assert.strictEqual(result.attempt, 2);

				// Verify database updated
				const updated = yield* db
					.select()
					.from(learnerMaps)
					.where(eq(learnerMaps.id, learnerMapId))
					.limit(1);

				assert.strictEqual(updated[0]?.status, "draft");
				assert.strictEqual(updated[0]?.attempt, 2);
				assert.isNull(updated[0]?.submittedAt);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should increment attempt number correctly", () =>
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

				yield* db.insert(learnerMaps).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 5, // Already on attempt 5
					submittedAt: new Date(),
				});

				const result = yield* startNewAttempt(student.id, {
					assignmentId: assignment.id,
				});

				assert.isTrue(result.success);
				assert.strictEqual(result.attempt, 6);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getPeerStats", () => {
		it.effect("should return empty stats when no peer submissions", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* getPeerStats(student.id, {
					assignmentId: "any-assignment",
				});

				assert.strictEqual(result.count, 0);
				assert.isNull(result.avgScore);
				assert.isNull(result.medianScore);
				assert.isNull(result.highestScore);
				assert.isNull(result.lowestScore);
				assert.isNull(result.userPercentile);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should calculate peer statistics correctly", () =>
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
				const peer3 = yield* createTestUser({
					email: "peer3@test.com",
					role: "student",
				});

				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				// Create submitted learner maps with diagnoses
				const createSubmittedMapWithDiagnosis = (
					userId: string,
					score: number,
				) =>
					Effect.gen(function* () {
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
					});

				// Create peer submissions
				yield* createSubmittedMapWithDiagnosis(peer1.id, 0.6);
				yield* createSubmittedMapWithDiagnosis(peer2.id, 0.8);
				yield* createSubmittedMapWithDiagnosis(peer3.id, 1.0);

				// Create student's submission
				yield* createSubmittedMapWithDiagnosis(student.id, 0.7);

				const result = yield* getPeerStats(student.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.count, 3); // Only peers, not current user
				assert.strictEqual(result.avgScore, 0.8); // (0.6 + 0.8 + 1.0) / 3
				assert.strictEqual(result.medianScore, 0.8);
				assert.strictEqual(result.highestScore, 1);
				assert.strictEqual(result.lowestScore, 0.6);
				// User scored 0.7, so 1 peer (0.6) is below = 33.3%
				assert.strictEqual(result.userPercentile, 33.3);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should exclude current user from peer statistics", () =>
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

				// Only student has submitted (no peers)
				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});
				yield* db.insert(diagnoses).values({
					id: crypto.randomUUID(),
					goalMapId: goalMap.id,
					learnerMapId,
					score: 0.9,
					rubricVersion: "1.0",
				});

				const result = yield* getPeerStats(student.id, {
					assignmentId: assignment.id,
				});

				// Should be empty since only user has submitted, no peers
				assert.strictEqual(result.count, 0);
				assert.isNull(result.avgScore);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should handle user with 100th percentile (best score)", () =>
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

				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				// Peer scores low
				const peerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: peerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: peer1.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});
				yield* db.insert(diagnoses).values({
					id: crypto.randomUUID(),
					goalMapId: goalMap.id,
					learnerMapId: peerMapId,
					score: 0.5,
					rubricVersion: "1.0",
				});

				// Student scores perfect
				const studentMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: studentMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: "[]",
					edges: "[]",
					status: "submitted",
					attempt: 1,
				});
				yield* db.insert(diagnoses).values({
					id: crypto.randomUUID(),
					goalMapId: goalMap.id,
					learnerMapId: studentMapId,
					score: 1.0,
					rubricVersion: "1.0",
				});

				const result = yield* getPeerStats(student.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.count, 1);
				assert.strictEqual(result.userPercentile, 100); // Better than all peers
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("submitControlText", () => {
		it.effect("should return error for non-existent assignment", () =>
			Effect.gen(function* () {
				const student = yield* createTestUser({ role: "student" });

				const result = yield* submitControlText(student.id, {
					assignmentId: "non-existent",
					text: "This is my control text submission.",
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Assignment not found");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should create new learner map with control text", () =>
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

				const controlText =
					"This is my control group text submission explaining the concept.";

				const result = yield* submitControlText(student.id, {
					assignmentId: assignment.id,
					text: controlText,
				});

				assert.isTrue(result.success);
				assert.isDefined(result.learnerMapId);

				// Verify in database
				const saved = yield* db
					.select()
					.from(learnerMaps)
					.where(eq(learnerMaps.id, result.learnerMapId ?? ""))
					.limit(1);

				assert.strictEqual(saved.length, 1);
				assert.strictEqual(saved[0]?.controlText, controlText);
				assert.strictEqual(saved[0]?.status, "submitted");
				assert.strictEqual(saved[0]?.attempt, 1);
				assert.isNull(saved[0]?.nodes);
				assert.isNull(saved[0]?.edges);
				assert.isNotNull(saved[0]?.submittedAt);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should update existing draft with control text", () =>
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

				// Create existing draft learner map
				const learnerMapId = crypto.randomUUID();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: [{ id: "n1", data: {}, position: { x: 0, y: 0 } }],
					edges: [],
					status: "draft",
					attempt: 1,
				});

				const controlText = "Updated with control text instead of concept map.";

				const result = yield* submitControlText(student.id, {
					assignmentId: assignment.id,
					text: controlText,
				});

				assert.isTrue(result.success);
				assert.strictEqual(result.learnerMapId, learnerMapId);

				// Verify update
				const updated = yield* db
					.select()
					.from(learnerMaps)
					.where(eq(learnerMaps.id, learnerMapId))
					.limit(1);

				assert.strictEqual(updated[0]?.controlText, controlText);
				assert.strictEqual(updated[0]?.status, "submitted");
				assert.isNotNull(updated[0]?.submittedAt);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return error if already submitted", () =>
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

				// Create already submitted learner map
				yield* db.insert(learnerMaps).values({
					id: crypto.randomUUID(),
					assignmentId: assignment.id,
					goalMapId: goalMap.id,
					kitId: kit.id,
					userId: student.id,
					nodes: [],
					edges: [],
					controlText: "Already submitted text.",
					status: "submitted",
					attempt: 1,
					submittedAt: new Date(),
				});

				const result = yield* submitControlText(student.id, {
					assignmentId: assignment.id,
					text: "Trying to submit again.",
				});

				assert.isFalse(result.success);
				assert.strictEqual(result.error, "Already submitted");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});
});
