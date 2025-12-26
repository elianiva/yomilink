import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import Papa from "papaparse";
import {
	classifyEdges,
	compareMaps,
	type DiagnosisResult,
	type EdgeClassification,
} from "@/lib/learnermap-comparator";
import { authMiddleware } from "@/middlewares/auth";
import {
	assignments,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
} from "@/server/db/schema/app-schema";
import { user as usersTable } from "@/server/db/schema/auth-schema";
import { Database, DatabaseLive } from "../db/client";

export const GetAnalyticsForAssignmentSchema = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
});

export const GetLearnerMapForAnalyticsSchema = Schema.Struct({
	learnerMapId: Schema.NonEmptyString,
});

export const ExportAnalyticsSchema = Schema.Struct({
	assignmentId: Schema.NonEmptyString,
	format: Schema.Literal("csv", "json"),
});

export interface TeacherAssignment {
	id: string;
	title: string;
	goalMapId: string;
	goalMapTitle: string | null;
	kitId: string | null;
	totalSubmissions: number;
	avgScore: number | null;
	createdAt: number;
	dueAt: number | null;
}

export interface LearnerAnalytics {
	userId: string;
	userName: string;
	learnerMapId: string;
	status: "draft" | "submitted";
	score: number | null;
	attempt: number;
	submittedAt: number | null;
	correct: number;
	missing: number;
	excessive: number;
	totalGoalEdges: number;
}

export interface AssignmentAnalytics {
	assignment: {
		id: string;
		title: string;
		goalMapId: string;
		goalMapTitle: string | null;
		kitId: string | null;
		createdAt: number;
		dueAt: number | null;
	};
	goalMap: {
		id: string;
		title: string;
		nodes: any;
		edges: any;
		direction: "bi" | "uni" | "multi";
	};
	learners: LearnerAnalytics[];
	summary: {
		totalLearners: number;
		submittedCount: number;
		draftCount: number;
		avgScore: number | null;
		medianScore: number | null;
		highestScore: number | null;
		lowestScore: number | null;
	};
}

export interface LearnerMapDetails {
	learnerMap: {
		id: string;
		userId: string;
		userName: string;
		status: string;
		attempt: number;
		submittedAt: number | null;
		nodes: any;
		edges: any;
	};
	goalMap: {
		id: string;
		title: string;
		nodes: any;
		edges: any;
		direction: "bi" | "uni" | "multi";
	};
	diagnosis: DiagnosisResult;
	edgeClassifications: EdgeClassification[];
}

export interface ExportResult {
	filename: string;
	data: string;
	contentType: "text/csv" | "application/json";
}

export const getTeacherAssignmentsForAnalytics = createServerFn()
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			const assignments_ = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						title: assignments.title,
						goalMapId: assignments.goalMapId,
						goalMapTitle: goalMaps.title,
						kitId: kits.id,
						createdAt: assignments.createdAt,
						dueAt: assignments.dueAt,
					})
					.from(assignments)
					.leftJoin(goalMaps, eq(assignments.goalMapId, goalMaps.id))
					.leftJoin(kits, eq(assignments.kitId, kits.id))
					.where(eq(assignments.createdBy, user.id))
					.orderBy(desc(assignments.createdAt))
					.all(),
			);

			const assignmentsWithStats: TeacherAssignment[] = [];
			for (const assignment of assignments_) {
				const submissionCount = yield* Effect.tryPromise(() =>
					db
						.select({ count: db.$count(learnerMaps.id) })
						.from(learnerMaps)
						.where(eq(learnerMaps.assignmentId, assignment.id))
						.get(),
				);

				const diagnosesForAssignment = yield* Effect.tryPromise(() =>
					db
						.select({ score: diagnoses.score })
						.from(diagnoses)
						.where(eq(diagnoses.goalMapId, assignment.goalMapId))
						.all(),
				);

				const scores = diagnosesForAssignment
					.map((d) => d.score)
					.filter((s): s is number => s !== null);

				const avgScore =
					scores.length > 0
						? scores.reduce((a, b) => a + b, 0) / scores.length
						: null;

				assignmentsWithStats.push({
					id: assignment.id,
					title: assignment.title,
					goalMapId: assignment.goalMapId,
					goalMapTitle: assignment.goalMapTitle,
					kitId: assignment.kitId,
					totalSubmissions: Number(submissionCount?.count ?? 0),
					avgScore,
					createdAt: assignment.createdAt?.getTime() ?? 0,
					dueAt: assignment.dueAt?.getTime() ?? null,
				});
			}

			return assignmentsWithStats;
		}).pipe(
			Effect.provide(DatabaseLive),
			Effect.withSpan("getTeacherAssignmentsForAnalytics"),
			Effect.runPromise,
		);
	});

export const getAnalyticsForAssignment = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetAnalyticsForAssignmentSchema)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			const assignment = yield* Effect.tryPromise(() =>
				db
					.select({
						id: assignments.id,
						title: assignments.title,
						goalMapId: assignments.goalMapId,
						kitId: assignments.kitId,
						createdAt: assignments.createdAt,
						dueAt: assignments.dueAt,
					})
					.from(assignments)
					.where(eq(assignments.id, data.assignmentId))
					.get(),
			);

			if (!assignment) {
				throw new Error("Assignment not found");
			}

			const goalMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: goalMaps.id,
						title: goalMaps.title,
						nodes: goalMaps.nodes,
						edges: goalMaps.edges,
						direction: goalMaps.direction,
					})
					.from(goalMaps)
					.where(eq(goalMaps.id, assignment.goalMapId))
					.get(),
			);

			if (!goalMap) {
				throw new Error("Goal map not found");
			}

			const learnerMapsData = yield* Effect.tryPromise(() =>
				db
					.select({
						id: learnerMaps.id,
						userId: learnerMaps.userId,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						submittedAt: learnerMaps.submittedAt,
						score: diagnoses.score,
						userName: usersTable.name,
					})
					.from(learnerMaps)
					.innerJoin(usersTable, eq(learnerMaps.userId, usersTable.id))
					.leftJoin(diagnoses, eq(diagnoses.learnerMapId, learnerMaps.id))
					.where(eq(learnerMaps.assignmentId, data.assignmentId))
					.orderBy(desc(learnerMaps.attempt), desc(learnerMaps.updatedAt))
					.all(),
			);

			const lastAttempts = new Map<string, any>();
			for (const lm of learnerMapsData) {
				const existing = lastAttempts.get(lm.userId);
				if (!existing) {
					lastAttempts.set(lm.userId, lm);
				}
			}

			const finalLearners: LearnerAnalytics[] = [];
			for (const [_userId, lm] of lastAttempts) {
				const diagnosisData =
					lm.score !== null
						? yield* Effect.tryPromise(() =>
								db
									.select({ perLink: diagnoses.perLink })
									.from(diagnoses)
									.where(eq(diagnoses.learnerMapId, lm.id))
									.get(),
							)
						: null;

				let correct = 0;
				let missing = 0;
				let excessive = 0;
				let totalGoalEdges = 0;

				if (diagnosisData?.perLink) {
					try {
						const parsed =
							typeof diagnosisData.perLink === "string"
								? JSON.parse(diagnosisData.perLink)
								: diagnosisData.perLink;
						correct = parsed.correct?.length ?? 0;
						missing = parsed.missing?.length ?? 0;
						excessive = parsed.excessive?.length ?? 0;
						totalGoalEdges = parsed.totalGoalEdges ?? 0;
					} catch {}
				}

				finalLearners.push({
					userId: lm.userId,
					userName: lm.userName,
					learnerMapId: lm.id,
					status: lm.status,
					score: lm.score,
					attempt: lm.attempt,
					submittedAt: lm.submittedAt?.getTime() ?? null,
					correct,
					missing,
					excessive,
					totalGoalEdges,
				});
			}

			const scores = finalLearners
				.map((l) => l.score)
				.filter((s): s is number => s !== null);

			const summary = {
				totalLearners: finalLearners.length,
				submittedCount: finalLearners.filter((l) => l.status === "submitted")
					.length,
				draftCount: finalLearners.filter((l) => l.status === "draft").length,
				avgScore:
					scores.length > 0
						? scores.reduce((a, b) => a + b, 0) / scores.length
						: null,
				medianScore:
					scores.length > 0
						? scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]
						: null,
				highestScore: scores.length > 0 ? Math.max(...scores) : null,
				lowestScore: scores.length > 0 ? Math.min(...scores) : null,
			};

			return {
				assignment: {
					id: assignment.id,
					title: assignment.title,
					goalMapId: assignment.goalMapId,
					goalMapTitle: goalMap.title,
					kitId: assignment.kitId,
					createdAt: assignment.createdAt?.getTime() ?? 0,
					dueAt: assignment.dueAt?.getTime() ?? null,
				},
				goalMap: {
					id: goalMap.id,
					title: goalMap.title,
					nodes:
						typeof goalMap.nodes === "string"
							? JSON.parse(goalMap.nodes)
							: goalMap.nodes,
					edges:
						typeof goalMap.edges === "string"
							? JSON.parse(goalMap.edges)
							: goalMap.edges,
					direction: goalMap.direction as "bi" | "uni" | "multi",
				},
				learners: finalLearners,
				summary,
			} as AssignmentAnalytics;
		}).pipe(
			Effect.provide(DatabaseLive),
			Effect.withSpan("getAnalyticsForAssignment"),
			Effect.runPromise,
		);
	});

export const getLearnerMapForAnalytics = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) =>
		Schema.decodeUnknownSync(GetLearnerMapForAnalyticsSchema)(raw),
	)
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		return Effect.gen(function* () {
			const db = yield* Database;

			const learnerMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: learnerMaps.id,
						userId: learnerMaps.userId,
						goalMapId: learnerMaps.goalMapId,
						status: learnerMaps.status,
						attempt: learnerMaps.attempt,
						submittedAt: learnerMaps.submittedAt,
						nodes: learnerMaps.nodes,
						edges: learnerMaps.edges,
						userName: usersTable.name,
					})
					.from(learnerMaps)
					.innerJoin(usersTable, eq(learnerMaps.userId, usersTable.id))
					.where(eq(learnerMaps.id, data.learnerMapId))
					.get(),
			);

			if (!learnerMap) {
				throw new Error("Learner map not found");
			}

			const goalMap = yield* Effect.tryPromise(() =>
				db
					.select({
						id: goalMaps.id,
						title: goalMaps.title,
						nodes: goalMaps.nodes,
						edges: goalMaps.edges,
						direction: goalMaps.direction,
					})
					.from(goalMaps)
					.where(eq(goalMaps.id, learnerMap.goalMapId))
					.get(),
			);

			if (!goalMap) {
				throw new Error("Goal map not found");
			}

			const goalMapEdges =
				typeof goalMap.edges === "string"
					? JSON.parse(goalMap.edges)
					: goalMap.edges;
			const learnerEdges =
				typeof learnerMap.edges === "string"
					? JSON.parse(learnerMap.edges)
					: learnerMap.edges;

			const diagnosis = yield* compareMaps(goalMapEdges, learnerEdges);
			const edgeClassifications = yield* classifyEdges(
				goalMapEdges,
				learnerEdges,
			);

			return {
				learnerMap: {
					id: learnerMap.id,
					userId: learnerMap.userId,
					userName: learnerMap.userName,
					status: learnerMap.status,
					attempt: learnerMap.attempt,
					submittedAt: learnerMap.submittedAt?.getTime() ?? null,
					nodes:
						typeof learnerMap.nodes === "string"
							? JSON.parse(learnerMap.nodes)
							: learnerMap.nodes,
					edges:
						typeof learnerMap.edges === "string"
							? JSON.parse(learnerMap.edges)
							: learnerMap.edges,
				},
				goalMap: {
					id: goalMap.id,
					title: goalMap.title,
					nodes:
						typeof goalMap.nodes === "string"
							? JSON.parse(goalMap.nodes)
							: goalMap.nodes,
					edges: goalMapEdges,
					direction: goalMap.direction as "bi" | "uni" | "multi",
				},
				diagnosis,
				edgeClassifications,
			};
		}).pipe(
			Effect.provide(DatabaseLive),
			Effect.withSpan("getLearnerMapForAnalytics"),
			Effect.runPromise,
		);
	});

export const exportAnalyticsData = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(ExportAnalyticsSchema)(raw))
	.handler(async ({ data, context }) => {
		const user = context.user;
		if (!user) throw new Error("Unauthorized");

		const analyticsResult = await getAnalyticsForAssignment({
			data,
		});

		if (!("learners" in analyticsResult)) {
			throw new Error("Failed to load analytics data");
		}

		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "")
			.substring(0, 15);

		if (data.format === "csv") {
			const csvData = [
				[
					"UserID",
					"UserName",
					"LearnerMapID",
					"Status",
					"Attempt",
					"Score",
					"Correct",
					"Missing",
					"Excessive",
					"TotalGoalEdges",
					"SubmittedAt",
					"AssignmentTitle",
				],
			];

			for (const learner of analyticsResult.learners) {
				csvData.push([
					learner.userId,
					learner.userName,
					learner.learnerMapId,
					learner.status,
					learner.attempt.toString(),
					learner.score?.toString() ?? "0",
					learner.correct.toString(),
					learner.missing.toString(),
					learner.excessive.toString(),
					learner.totalGoalEdges.toString(),
					learner.submittedAt
						? new Date(learner.submittedAt).toISOString()
						: "",
					analyticsResult.assignment.title,
				]);
			}

			const csv = Papa.unparse(csvData, { header: false });

			return {
				filename: `KB-Analytics-${timestamp}.csv`,
				data: csv,
				contentType: "text/csv" as const,
			};
		}

		const jsonData = {
			assignment: analyticsResult.assignment,
			goalMap: analyticsResult.goalMap,
			learners: analyticsResult.learners,
			summary: analyticsResult.summary,
			exportedAt: new Date().toISOString(),
		};

		return {
			filename: `KB-Analytics-${timestamp}.json`,
			data: JSON.stringify(jsonData, null, 2),
			contentType: "application/json" as const,
		};
	});

export const AnalyticsRpc = {
	analytics: () => ["analytics"],

	getTeacherAssignments: () =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), "assignments"],
			queryFn: () => getTeacherAssignmentsForAnalytics(),
		}),

	getAnalyticsForAssignment: (assignmentId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), assignmentId, "data"],
			queryFn: () => getAnalyticsForAssignment({ data: { assignmentId } }),
		}),

	getLearnerMapForAnalytics: (learnerMapId: string) =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), learnerMapId, "details"],
			queryFn: () => getLearnerMapForAnalytics({ data: { learnerMapId } }),
		}),

	exportAnalyticsData: (assignmentId: string, format: "csv" | "json") =>
		queryOptions({
			queryKey: [...AnalyticsRpc.analytics(), assignmentId, "export", format],
			queryFn: () => exportAnalyticsData({ data: { assignmentId, format } }),
		}),
};
