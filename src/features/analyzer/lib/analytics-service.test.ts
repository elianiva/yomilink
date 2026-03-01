import { assert, beforeEach, describe, it } from "@effect/vitest";
import { Effect, Either } from "effect";

import { simpleGoalMap } from "@/__tests__/fixtures/goal-maps";
import {
	createTestAssignment,
	createTestDiagnosis,
	createTestGoalMap,
	createTestKit,
	createTestLearnerMap,
	createTestUser,
} from "@/__tests__/fixtures/service-fixtures";
import { resetDatabase } from "@/__tests__/utils/test-helpers";
import { DatabaseTest } from "@/server/db/client";

import {
	exportAnalyticsData,
	getAnalyticsForAssignment,
	getLearnerMapForAnalytics,
	getTeacherAssignments,
	type AssignmentAnalytics,
} from "./analytics-service";

describe("analytics-service", () => {
	beforeEach(() => Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))));

	describe("getTeacherAssignments", () => {
		it.effect("should return empty array when no assignments exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* getTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignments for the teacher", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id, {
					title: "Test Assignment",
				});

				const result = yield* getTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.title, "Test Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should only return assignments for the specific teacher", () =>
			Effect.gen(function* () {
				const teacher1 = yield* createTestUser({ email: "teacher1@test.com" });
				const teacher2 = yield* createTestUser({ email: "teacher2@test.com" });
				const goalMap1 = yield* createTestGoalMap(teacher1.id);
				const goalMap2 = yield* createTestGoalMap(teacher2.id);
				const kit1 = yield* createTestKit(goalMap1.id, teacher1.id);
				const kit2 = yield* createTestKit(goalMap2.id, teacher2.id);
				yield* createTestAssignment(teacher1.id, goalMap1.id, kit1.id, {
					title: "Teacher 1 Assignment",
				});
				yield* createTestAssignment(teacher2.id, goalMap2.id, kit2.id, {
					title: "Teacher 2 Assignment",
				});

				const result = yield* getTeacherAssignments(teacher1.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.title, "Teacher 1 Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return assignments ordered by createdAt descending", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap1 = yield* createTestGoalMap(teacher.id, {
					title: "Goal 1",
				});
				const goalMap2 = yield* createTestGoalMap(teacher.id, {
					title: "Goal 2",
				});
				const kit1 = yield* createTestKit(goalMap1.id, teacher.id);
				const kit2 = yield* createTestKit(goalMap2.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap1.id, kit1.id, {
					title: "Old Assignment",
					createdAt: new Date("2024-01-01"),
				});
				yield* createTestAssignment(teacher.id, goalMap2.id, kit2.id, {
					title: "New Assignment",
					createdAt: new Date("2024-01-02"),
				});

				const result = yield* getTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 2);
				assert.strictEqual(result[0]?.title, "New Assignment");
				assert.strictEqual(result[1]?.title, "Old Assignment");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include goal map title in results", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "My Goal Map",
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				const result = yield* getTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.goalMapTitle, "My Goal Map");
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include kit id in results", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				const result = yield* getTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(result[0]?.kitId, kit.id);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should convert dates to timestamps", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const dueAt = new Date("2024-12-31");
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id, {
					dueAt,
				});

				const result = yield* getTeacherAssignments(teacher.id);

				assert.strictEqual(result.length, 1);
				assert.strictEqual(typeof result[0]?.createdAt, "number");
				assert.strictEqual(result[0]?.dueAt, dueAt.getTime());
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getAnalyticsForAssignment", () => {
		it.effect("should return AssignmentNotFoundError when assignment does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* Effect.either(
					getAnalyticsForAssignment(teacher.id, {
						assignmentId: "non-existent-id",
					}),
				);

				Either.match(result, {
				onLeft: (error) => assert.ok("_tag" in error && error._tag === "AssignmentNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return AssignmentNotFoundError when user is not the creator", () =>
			Effect.gen(function* () {
				const teacher1 = yield* createTestUser({
					email: "teacher1@test.com",
				});
				const teacher2 = yield* createTestUser({
					email: "teacher2@test.com",
				});
				const goalMap = yield* createTestGoalMap(teacher1.id);
				const kit = yield* createTestKit(goalMap.id, teacher1.id);
				const assignment = yield* createTestAssignment(teacher1.id, goalMap.id, kit.id);

				const result = yield* Effect.either(
					getAnalyticsForAssignment(teacher2.id, {
						assignmentId: assignment.id,
					}),
				);

				Either.match(result, {
				onLeft: (error) => assert.ok("_tag" in error && error._tag === "AssignmentNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return analytics for assignment with no learners", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Test Goal Map",
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id, {
					title: "Test Assignment",
				});

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.assignment.id, assignment.id);
				assert.strictEqual(result.assignment.title, "Test Assignment");
				assert.strictEqual(result.goalMap.title, "Test Goal Map");
				assert.strictEqual(result.learners.length, 0);
				assert.strictEqual(result.summary.totalLearners, 0);
				assert.strictEqual(result.summary.submittedCount, 0);
				assert.strictEqual(result.summary.draftCount, 0);
				assert.isNull(result.summary.avgScore);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return analytics with learners", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({
					email: "student@test.com",
					name: "Test Student",
				});
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);
				yield* createTestLearnerMap(student.id, assignment.id, goalMap.id, kit.id, {
					status: "submitted",
					submittedAt: new Date(),
				});

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.learners.length, 1);
				assert.strictEqual(result.learners[0]?.userName, "Test Student");
				assert.strictEqual(result.learners[0]?.status, "submitted");
				assert.strictEqual(result.summary.totalLearners, 1);
				assert.strictEqual(result.summary.submittedCount, 1);
				assert.strictEqual(result.summary.draftCount, 0);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should calculate summary statistics correctly", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student1 = yield* createTestUser({
					email: "student1@test.com",
					name: "Student 1",
				});
				const student2 = yield* createTestUser({
					email: "student2@test.com",
					name: "Student 2",
				});
				const student3 = yield* createTestUser({
					email: "student3@test.com",
					name: "Student 3",
				});
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				// Create learner maps with diagnoses
				const lm1 = yield* createTestLearnerMap(
					student1.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{ status: "submitted", submittedAt: new Date() },
				);
				yield* createTestDiagnosis(goalMap.id, lm1.id, { score: 0.8 });

				const lm2 = yield* createTestLearnerMap(
					student2.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{ status: "submitted", submittedAt: new Date() },
				);
				yield* createTestDiagnosis(goalMap.id, lm2.id, { score: 0.6 });

				yield* createTestLearnerMap(student3.id, assignment.id, goalMap.id, kit.id, {
					status: "draft",
				});

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.summary.totalLearners, 3);
				assert.strictEqual(result.summary.submittedCount, 2);
				assert.strictEqual(result.summary.draftCount, 1);
				assert.strictEqual(result.summary.avgScore, 0.7);
				assert.strictEqual(result.summary.highestScore, 0.8);
				assert.strictEqual(result.summary.lowestScore, 0.6);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should parse per-link diagnosis data correctly", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({
					email: "student@test.com",
					name: "Student",
				});
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);
				const learnerMap = yield* createTestLearnerMap(
					student.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{ status: "submitted", submittedAt: new Date() },
				);

				const perLinkData = {
					correct: [{ source: "c1", target: "l1" }],
					missing: [{ source: "l1", target: "c2" }],
					excessive: [],
					totalGoalEdges: 2,
				};
				yield* createTestDiagnosis(goalMap.id, learnerMap.id, {
					score: 0.5,
					perLink: JSON.stringify(perLinkData),
				});

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.learners.length, 1);
				assert.strictEqual(result.learners[0]?.correct, 1);
				assert.strictEqual(result.learners[0]?.missing, 1);
				assert.strictEqual(result.learners[0]?.excessive, 0);
				assert.strictEqual(result.learners[0]?.totalGoalEdges, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include goal map nodes and edges", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
					direction: "uni",
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				assert.strictEqual(result.goalMap.nodes.length, 3);
				assert.strictEqual(result.goalMap.edges.length, 2);
				assert.strictEqual(result.goalMap.direction, "uni");
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("getLearnerMapForAnalytics", () => {
		it.effect("should return LearnerMapNotFoundError when learner map does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(
					getLearnerMapForAnalytics({ learnerMapId: "non-existent-id" }),
				);

				Either.match(result, {
				onLeft: (error) => assert.ok("_tag" in error && error._tag === "LearnerMapNotFoundError"),
					onRight: () => assert.fail("Expected Left but got Right"),
				});
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return learner map details with diagnosis", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({
					email: "student@test.com",
					name: "Test Student",
				});
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);
				const learnerNodes = simpleGoalMap.nodes;
				const learnerEdges = [simpleGoalMap.edges[0]]; // Only one edge
				const learnerMap = yield* createTestLearnerMap(
					student.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{
						status: "submitted",
						submittedAt: new Date(),
						nodes: JSON.stringify(learnerNodes),
						edges: JSON.stringify(learnerEdges),
					},
				);

				const result = yield* getLearnerMapForAnalytics({
					learnerMapId: learnerMap.id,
				});

				assert.strictEqual(result.learnerMap.id, learnerMap.id);
				assert.strictEqual(result.learnerMap.userName, "Test Student");
				assert.strictEqual(result.learnerMap.status, "submitted");
				assert.strictEqual(result.learnerMap.nodes.length, 3);
				assert.strictEqual(result.learnerMap.edges.length, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should include goal map details", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({ email: "student@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Test Goal Map",
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
					direction: "multi",
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);
				const learnerMap = yield* createTestLearnerMap(
					student.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{
						nodes: JSON.stringify(simpleGoalMap.nodes),
						edges: JSON.stringify([]),
					},
				);

				const result = yield* getLearnerMapForAnalytics({
					learnerMapId: learnerMap.id,
				});

				assert.strictEqual(result.goalMap.title, "Test Goal Map");
				assert.strictEqual(result.goalMap.direction, "multi");
				assert.strictEqual(result.goalMap.nodes.length, 3);
				assert.strictEqual(result.goalMap.edges.length, 2);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should calculate diagnosis comparing maps", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({ email: "student@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				// Learner has one correct edge and one excessive edge
				const learnerEdges = [
					simpleGoalMap.edges[0], // Correct: c1 -> l1
					{ id: "extra", source: "c2", target: "l1" }, // Excessive
				];
				const learnerMap = yield* createTestLearnerMap(
					student.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{
						nodes: JSON.stringify(simpleGoalMap.nodes),
						edges: JSON.stringify(learnerEdges),
					},
				);

				const result = yield* getLearnerMapForAnalytics({
					learnerMapId: learnerMap.id,
				});

				// Goal has 2 edges, learner has 1 correct, 1 missing, 1 excessive
				assert.strictEqual(result.diagnosis.correct.length, 1);
				assert.strictEqual(result.diagnosis.missing.length, 1);
				assert.strictEqual(result.diagnosis.excessive.length, 1);
				assert.strictEqual(result.diagnosis.totalGoalEdges, 2);
				assert.strictEqual(result.diagnosis.score, 0.5);
			}).pipe(Effect.provide(DatabaseTest)),
		);

		it.effect("should return edge classifications", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({ email: "student@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				const learnerEdges = [simpleGoalMap.edges[0]]; // Only first edge
				const learnerMap = yield* createTestLearnerMap(
					student.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{
						nodes: JSON.stringify(simpleGoalMap.nodes),
						edges: JSON.stringify(learnerEdges),
					},
				);

				const result = yield* getLearnerMapForAnalytics({
					learnerMapId: learnerMap.id,
				});

				// Should have classifications for learner edges + missing edges
				assert.isTrue(result.edgeClassifications.length > 0);
				const correctEdges = result.edgeClassifications.filter(
					(ec) => ec.type === "correct",
				);
				const missingEdges = result.edgeClassifications.filter(
					(ec) => ec.type === "missing",
				);
				assert.strictEqual(correctEdges.length, 1);
				assert.strictEqual(missingEdges.length, 1);
			}).pipe(Effect.provide(DatabaseTest)),
		);
	});

	describe("exportAnalyticsData", () => {
		const createMockAnalytics = (): AssignmentAnalytics => ({
			assignment: {
				id: "assign-1",
				title: "Test Assignment",
				goalMapId: "goal-1",
				goalMapTitle: "Test Goal Map",
				kitId: "kit-1",
				totalSubmissions: 1,
				createdAt: 1704067200000,
				dueAt: 1704153600000,
			},
			goalMap: {
				id: "goal-1",
				title: "Test Goal Map",
				nodes: [],
				edges: [],
				direction: "bi",
			},
			learners: [
				{
					userId: "user-1",
					userName: "Student One",
					learnerMapId: "lm-1",
					status: "submitted",
					score: 0.8,
					attempt: 1,
					submittedAt: 1704067200000,
					correct: 4,
					missing: 1,
					excessive: 0,
					totalGoalEdges: 5,
				},
				{
					userId: "user-2",
					userName: "Student Two",
					learnerMapId: "lm-2",
					status: "draft",
					score: null,
					attempt: 1,
					submittedAt: null,
					correct: 0,
					missing: 5,
					excessive: 0,
					totalGoalEdges: 5,
				},
			],
			summary: {
				totalLearners: 2,
				submittedCount: 1,
				draftCount: 1,
				avgScore: 0.8,
				medianScore: 0.8,
				highestScore: 0.8,
				lowestScore: 0.8,
			},
		});

		it.effect("should export to CSV format", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});

				assert.strictEqual(result.contentType, "text/csv");
				assert.isTrue(result.filename.startsWith("KB-Analytics-"));
				assert.isTrue(result.filename.endsWith(".csv"));

				// Verify CSV content
				assert.isTrue(result.data.includes("UserID"));
				assert.isTrue(result.data.includes("UserName"));
				assert.isTrue(result.data.includes("LearnerMapID"));
				assert.isTrue(result.data.includes("Status"));
				assert.isTrue(result.data.includes("Score"));
				assert.isTrue(result.data.includes("Correct"));
				assert.isTrue(result.data.includes("Missing"));
				assert.isTrue(result.data.includes("Excessive"));
				assert.isTrue(result.data.includes("TotalGoalEdges"));
				assert.isTrue(result.data.includes("AssignmentTitle"));

				// Verify data rows
				assert.isTrue(result.data.includes("Student One"));
				assert.isTrue(result.data.includes("Student Two"));
				assert.isTrue(result.data.includes("submitted"));
				assert.isTrue(result.data.includes("draft"));
			}),
		);

		it.effect("should export to JSON format", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				assert.strictEqual(result.contentType, "application/json");
				assert.isTrue(result.filename.startsWith("KB-Analytics-"));
				assert.isTrue(result.filename.endsWith(".json"));

				// Verify JSON content
				const parsed = JSON.parse(result.data);
				assert.strictEqual(parsed.assignment.id, "assign-1");
				assert.strictEqual(parsed.assignment.title, "Test Assignment");
				assert.strictEqual(parsed.learners.length, 2);
				assert.strictEqual(parsed.summary.totalLearners, 2);
				assert.isDefined(parsed.exportedAt);
			}),
		);

		it.effect("should handle empty learners array", () =>
			Effect.gen(function* () {
				const baseAnalytics = createMockAnalytics();
				const analytics = {
					...baseAnalytics,
					learners: [],
					summary: {
						totalLearners: 0,
						submittedCount: 0,
						draftCount: 0,
						avgScore: null,
						medianScore: null,
						highestScore: null,
						lowestScore: null,
					},
				};

				const csvResult = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});
				const jsonResult = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				// CSV should have header row
				assert.isTrue(csvResult.data.includes("UserID"));

				// JSON should have empty learners array
				const parsed = JSON.parse(jsonResult.data);
				assert.strictEqual(parsed.learners.length, 0);
			}),
		);

		it.effect("should handle null score values in CSV", () =>
			Effect.gen(function* () {
				const baseAnalytics = createMockAnalytics();
				const analytics = {
					...baseAnalytics,
					learners: [
						{
							userId: "user-1",
							userName: "Student",
							learnerMapId: "lm-1",
							status: "draft" as const,
							score: null,
							attempt: 1,
							submittedAt: null,
							correct: 0,
							missing: 0,
							excessive: 0,
							totalGoalEdges: 0,
						},
					],
				};

				const result = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});

				// Score null should become "0"
				assert.isTrue(result.data.includes(",0,"));
			}),
		);

		it.effect("should format timestamp in filename correctly", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const csvResult = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});
				const jsonResult = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				// Filename format: KB-Analytics-YYYY-MM-DDTHHMM (15 chars from ISO string with colons/periods removed)
				// ISO: "2026-01-01T16:05:39.123Z" -> replace ":" and "." -> "2026-01-01T160539123Z" -> substring(0,15) -> "2026-01-01T1605"
				const filenamePattern = /KB-Analytics-\d{4}-\d{2}-\d{2}T\d{4}\.(csv|json)/;
				assert.isTrue(
					filenamePattern.test(csvResult.filename),
					`CSV filename ${csvResult.filename} should match pattern`,
				);
				assert.isTrue(
					filenamePattern.test(jsonResult.filename),
					`JSON filename ${jsonResult.filename} should match pattern`,
				);
			}),
		);

		it.effect("should include submittedAt as ISO string in CSV when present", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});

				// Student One has submittedAt
				assert.isTrue(result.data.includes("2024-01-01T"));
			}),
		);

		it.effect("should include all learner data in JSON export", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				const parsed = JSON.parse(result.data);
				const learner = parsed.learners[0];

				assert.strictEqual(learner.userId, "user-1");
				assert.strictEqual(learner.userName, "Student One");
				assert.strictEqual(learner.learnerMapId, "lm-1");
				assert.strictEqual(learner.status, "submitted");
				assert.strictEqual(learner.score, 0.8);
				assert.strictEqual(learner.attempt, 1);
				assert.strictEqual(learner.correct, 4);
				assert.strictEqual(learner.missing, 1);
				assert.strictEqual(learner.excessive, 0);
				assert.strictEqual(learner.totalGoalEdges, 5);
			}),
		);

		it.effect("should include goal map in JSON export", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				const parsed = JSON.parse(result.data);

				assert.strictEqual(parsed.goalMap.id, "goal-1");
				assert.strictEqual(parsed.goalMap.title, "Test Goal Map");
				assert.strictEqual(parsed.goalMap.direction, "bi");
			}),
		);
	});
});
