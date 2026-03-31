import { beforeEach, describe, expect, it } from "vite-plus/test";
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
	getLearnerSummaryText,
	getTeacherAssignments,
	type AssignmentAnalytics,
} from "./analytics-service";

describe("analytics-service", () => {
	beforeEach(() =>
		Effect.runPromise(resetDatabase.pipe(Effect.provide(DatabaseTest))),
	);

	describe("getTeacherAssignments", () => {
		it("should return empty array when no assignments exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* getTeacherAssignments(teacher.id);

				expect(result.length).toBe(0);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return assignments for the teacher", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id, {
					title: "Test Assignment",
				});

				const result = yield* getTeacherAssignments(teacher.id);

				expect(result.length).toBe(1);
				expect(result[0]?.title).toBe("Test Assignment");
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should only return assignments for the specific teacher", () =>
			Effect.gen(function* () {
				const teacher1 = yield* createTestUser({
					email: "teacher1@test.com",
				});
				const teacher2 = yield* createTestUser({
					email: "teacher2@test.com",
				});
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

				expect(result.length).toBe(1);
				expect(result[0]?.title).toBe("Teacher 1 Assignment");
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return assignments ordered by createdAt descending", () =>
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

				expect(result.length).toBe(2);
				expect(result[0]?.title).toBe("New Assignment");
				expect(result[1]?.title).toBe("Old Assignment");
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should include goal map title in results", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "My Goal Map",
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				const result = yield* getTeacherAssignments(teacher.id);

				expect(result.length).toBe(1);
				expect(result[0]?.goalMapTitle).toBe("My Goal Map");
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should include kit id in results", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id);

				const result = yield* getTeacherAssignments(teacher.id);

				expect(result.length).toBe(1);
				expect(result[0]?.kitId).toBe(kit.id);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should convert dates to timestamps", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id);
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const dueAt = new Date("2024-12-31");
				yield* createTestAssignment(teacher.id, goalMap.id, kit.id, {
					dueAt,
				});

				const result = yield* getTeacherAssignments(teacher.id);

				expect(result.length).toBe(1);
				expect(typeof result[0]?.createdAt).toBe("number");
				expect(result[0]?.dueAt).toBe(dueAt.getTime());
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
	});

	describe("getAnalyticsForAssignment", () => {
		it("should return AssignmentNotFoundError when assignment does not exist", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();

				const result = yield* Effect.either(
					getAnalyticsForAssignment(teacher.id, {
						assignmentId: "non-existent-id",
					}),
				);

				Either.match(result, {
					onLeft: (error) =>
						expect(
							"_tag" in error && error._tag === "AssignmentNotFoundError",
						).toBeTruthy(),
					onRight: () => {
						throw new Error("Expected Left but got Right");
					},
				});
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return AssignmentNotFoundError when user is not the creator", () =>
			Effect.gen(function* () {
				const teacher1 = yield* createTestUser({
					email: "teacher1@test.com",
				});
				const teacher2 = yield* createTestUser({
					email: "teacher2@test.com",
				});
				const goalMap = yield* createTestGoalMap(teacher1.id);
				const kit = yield* createTestKit(goalMap.id, teacher1.id);
				const assignment = yield* createTestAssignment(
					teacher1.id,
					goalMap.id,
					kit.id,
				);

				const result = yield* Effect.either(
					getAnalyticsForAssignment(teacher2.id, {
						assignmentId: assignment.id,
					}),
				);

				Either.match(result, {
					onLeft: (error) =>
						expect(
							"_tag" in error && error._tag === "AssignmentNotFoundError",
						).toBeTruthy(),
					onRight: () => {
						throw new Error("Expected Left but got Right");
					},
				});
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return analytics for assignment with no learners", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					title: "Test Goal Map",
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
					{
						title: "Test Assignment",
					},
				);

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				expect(result.assignment.id).toBe(assignment.id);
				expect(result.assignment.title).toBe("Test Assignment");
				expect(result.goalMap.title).toBe("Test Goal Map");
				expect(result.learners.length).toBe(0);
				expect(result.summary.totalLearners).toBe(0);
				expect(result.summary.submittedCount).toBe(0);
				expect(result.summary.draftCount).toBe(0);
				expect(result.summary.avgScore).toBeNull();
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return analytics with learners", () =>
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
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);
				yield* createTestLearnerMap(student.id, assignment.id, goalMap.id, kit.id, {
					status: "submitted",
					submittedAt: new Date(),
				});

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				expect(result.learners.length).toBe(1);
				expect(result.learners[0]?.userName).toBe("Test Student");
				expect(result.learners[0]?.status).toBe("submitted");
				expect(result.summary.totalLearners).toBe(1);
				expect(result.summary.submittedCount).toBe(1);
				expect(result.summary.draftCount).toBe(0);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should calculate summary statistics correctly", () =>
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
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

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

				expect(result.summary.totalLearners).toBe(3);
				expect(result.summary.submittedCount).toBe(2);
				expect(result.summary.draftCount).toBe(1);
				expect(result.summary.avgScore).toBe(0.7);
				expect(result.summary.highestScore).toBe(0.8);
				expect(result.summary.lowestScore).toBe(0.6);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should parse per-link diagnosis data correctly", () =>
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
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);
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

				expect(result.learners.length).toBe(1);
				expect(result.learners[0]?.correct).toBe(1);
				expect(result.learners[0]?.missing).toBe(1);
				expect(result.learners[0]?.excessive).toBe(0);
				expect(result.learners[0]?.totalGoalEdges).toBe(2);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should include goal map nodes and edges", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
					direction: "uni",
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

				const result = yield* getAnalyticsForAssignment(teacher.id, {
					assignmentId: assignment.id,
				});

				expect(result.goalMap.nodes.length).toBe(3);
				expect(result.goalMap.edges.length).toBe(2);
				expect(result.goalMap.direction).toBe("uni");
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
	});

	describe("getLearnerMapForAnalytics", () => {
		it("should return LearnerMapNotFoundError when learner map does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(
					getLearnerMapForAnalytics({ learnerMapId: "non-existent-id" }),
				);

				Either.match(result, {
					onLeft: (error) =>
						expect(
							"_tag" in error &&
								error._tag === "LearnerMapNotFoundError",
						).toBeTruthy(),
					onRight: () => {
						throw new Error("Expected Left but got Right");
					},
				});
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return learner map details with diagnosis", () =>
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
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);
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

				expect(result.learnerMap.id).toBe(learnerMap.id);
				expect(result.learnerMap.userName).toBe("Test Student");
				expect(result.learnerMap.status).toBe("submitted");
				expect(result.learnerMap.nodes.length).toBe(3);
				expect(result.learnerMap.edges.length).toBe(1);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should include goal map details", () =>
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
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);
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

				expect(result.goalMap.title).toBe("Test Goal Map");
				expect(result.goalMap.direction).toBe("multi");
				expect(result.goalMap.nodes.length).toBe(3);
				expect(result.goalMap.edges.length).toBe(2);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should calculate diagnosis comparing maps", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({ email: "student@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

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
				expect(result.diagnosis.correct.length).toBe(1);
				expect(result.diagnosis.missing.length).toBe(1);
				expect(result.diagnosis.excessive.length).toBe(1);
				expect(result.diagnosis.totalGoalEdges).toBe(2);
				expect(result.diagnosis.score).toBe(0.5);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return edge classifications", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({ email: "student@test.com" });
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);

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
				expect(result.edgeClassifications.length > 0).toBe(true);
				const correctEdges = result.edgeClassifications.filter(
					(ec) => ec.type === "correct",
				);
				const missingEdges = result.edgeClassifications.filter(
					(ec) => ec.type === "missing",
				);
				expect(correctEdges.length).toBe(1);
				expect(missingEdges.length).toBe(1);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
	});

	describe("getLearnerSummaryText", () => {
		it("should return LearnerMapNotFoundError when learner map does not exist", () =>
			Effect.gen(function* () {
				const result = yield* Effect.either(
					getLearnerSummaryText({ learnerMapId: "non-existent-id" }),
				);

				Either.match(result, {
					onLeft: (error) =>
						expect(
							"_tag" in error &&
								error._tag === "LearnerMapNotFoundError",
						).toBeTruthy(),
					onRight: () => {
						throw new Error("Expected Left but got Right");
					},
				});
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));

		it("should return learner summary text and metadata", () =>
			Effect.gen(function* () {
				const teacher = yield* createTestUser();
				const student = yield* createTestUser({
					email: "summary-student@test.com",
					name: "Summary Student",
				});
				const goalMap = yield* createTestGoalMap(teacher.id, {
					nodes: JSON.stringify(simpleGoalMap.nodes),
					edges: JSON.stringify(simpleGoalMap.edges),
				});
				const kit = yield* createTestKit(goalMap.id, teacher.id);
				const assignment = yield* createTestAssignment(
					teacher.id,
					goalMap.id,
					kit.id,
				);
				const submittedAt = new Date();
				const learnerMap = yield* createTestLearnerMap(
					student.id,
					assignment.id,
					goalMap.id,
					kit.id,
					{
						status: "submitted",
						submittedAt,
						controlText: "This is a full learner summary submission.",
					},
				);

				const result = yield* getLearnerSummaryText({
					learnerMapId: learnerMap.id,
				});

				expect(result.learnerMapId).toBe(learnerMap.id);
				expect(result.learnerId).toBe(student.id);
				expect(result.learnerName).toBe("Summary Student");
				expect(result.status).toBe("submitted");
				expect(result.submittedAt).toBe(submittedAt.getTime());
				expect(result.controlText).toBe(
					"This is a full learner summary submission.",
				);
			}).pipe(Effect.provide(DatabaseTest), Effect.runPromise));
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

		it("should export to CSV format", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});

				expect(result.contentType).toBe("text/csv");
				expect(result.filename.startsWith("KB-Analytics-")).toBe(true);
				expect(result.filename.endsWith(".csv")).toBe(true);

				// Verify CSV content
				expect(result.data.includes("UserID")).toBe(true);
				expect(result.data.includes("UserName")).toBe(true);
				expect(result.data.includes("LearnerMapID")).toBe(true);
				expect(result.data.includes("Status")).toBe(true);
				expect(result.data.includes("Score")).toBe(true);
				expect(result.data.includes("Correct")).toBe(true);
				expect(result.data.includes("Missing")).toBe(true);
				expect(result.data.includes("Excessive")).toBe(true);
				expect(result.data.includes("TotalGoalEdges")).toBe(true);
				expect(result.data.includes("AssignmentTitle")).toBe(true);

				// Verify data rows
				expect(result.data.includes("Student One")).toBe(true);
				expect(result.data.includes("Student Two")).toBe(true);
				expect(result.data.includes("submitted")).toBe(true);
				expect(result.data.includes("draft")).toBe(true);
			}).pipe(Effect.runPromise));

		it("should export to JSON format", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				expect(result.contentType).toBe("application/json");
				expect(result.filename.startsWith("KB-Analytics-")).toBe(true);
				expect(result.filename.endsWith(".json")).toBe(true);

				// Verify JSON content
				const parsed = JSON.parse(result.data);
				expect(parsed.assignment.id).toBe("assign-1");
				expect(parsed.assignment.title).toBe("Test Assignment");
				expect(parsed.learners.length).toBe(2);
				expect(parsed.summary.totalLearners).toBe(2);
				expect(parsed.exportedAt).toBeDefined();
			}).pipe(Effect.runPromise));

		it("should handle empty learners array", () =>
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
				expect(csvResult.data.includes("UserID")).toBe(true);

				// JSON should have empty learners array
				const parsed = JSON.parse(jsonResult.data);
				expect(parsed.learners.length).toBe(0);
			}).pipe(Effect.runPromise));

		it("should handle null score values in CSV", () =>
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
				expect(result.data.includes(",0,")).toBe(true);
			}).pipe(Effect.runPromise));

		it("should format timestamp in filename correctly", () =>
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

				// Filename format: KB-Analytics-YYYY-MM-DDTHHMM
				const filenamePattern =
					/KB-Analytics-\d{4}-\d{2}-\d{2}T\d{4}\.(csv|json)/;
				expect(
					filenamePattern.test(csvResult.filename),
					`CSV filename ${csvResult.filename} should match pattern`,
				).toBe(true);
				expect(
					filenamePattern.test(jsonResult.filename),
					`JSON filename ${jsonResult.filename} should match pattern`,
				).toBe(true);
			}).pipe(Effect.runPromise));

		it("should include submittedAt as ISO string in CSV when present", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "csv",
				});

				// Student One has submittedAt
				expect(result.data.includes("2024-01-01T")).toBe(true);
			}).pipe(Effect.runPromise));

		it("should include all learner data in JSON export", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				const parsed = JSON.parse(result.data);
				const learner = parsed.learners[0];

				expect(learner.userId).toBe("user-1");
				expect(learner.userName).toBe("Student One");
				expect(learner.learnerMapId).toBe("lm-1");
				expect(learner.status).toBe("submitted");
				expect(learner.score).toBe(0.8);
				expect(learner.attempt).toBe(1);
				expect(learner.correct).toBe(4);
				expect(learner.missing).toBe(1);
				expect(learner.excessive).toBe(0);
				expect(learner.totalGoalEdges).toBe(5);
			}).pipe(Effect.runPromise));

		it("should include goal map in JSON export", () =>
			Effect.gen(function* () {
				const analytics = createMockAnalytics();

				const result = yield* exportAnalyticsData({
					analytics,
					format: "json",
				});

				const parsed = JSON.parse(result.data);

				expect(parsed.goalMap.id).toBe("goal-1");
				expect(parsed.goalMap.title).toBe("Test Goal Map");
				expect(parsed.goalMap.direction).toBe("bi");
			}).pipe(Effect.runPromise));
	});
});
