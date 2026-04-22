import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { assignments, diagnoses, goalMaps, learnerMaps } from "@/server/db/schema/app-schema";

import { compareMaps } from "./comparator";
import {
	AssignmentNotFoundError,
	GoalMapNotFoundError,
	LearnerMapAlreadySubmittedError,
	LearnerMapNotFoundError,
	NoPreviousAttemptError,
	PreviousAttemptNotSubmittedError,
	requireAssignmentCondition,
	requireAssignmentMembership,
	SubmitLearnerMapInput,
	StartNewAttemptInput,
	SubmitControlTextInput,
} from "./learner-map-service.shared";

export const saveLearnerMap = Effect.fn("saveLearnerMap")(function* (
	userId: string,
	data: {
		assignmentId: string;
		nodes?: string | null;
		edges?: string | null;
		controlText?: string | null;
	},
) {
	const db = yield* Database;

	const assignmentRows = yield* db
		.select({
			id: assignments.id,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
		})
		.from(assignments)
		.where(eq(assignments.id, data.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: data.assignmentId });
	}

	yield* requireAssignmentMembership(userId, data.assignmentId);

	const existingRows = yield* db
		.select({ id: learnerMaps.id, status: learnerMaps.status })
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, data.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const existing = existingRows[0];
	if (existing) {
		if (existing.status === "submitted") {
			return yield* new LearnerMapAlreadySubmittedError({ learnerMapId: existing.id });
		}

		yield* db
			.update(learnerMaps)
			.set({
				...(data.nodes !== undefined && { nodes: data.nodes }),
				...(data.edges !== undefined && { edges: data.edges }),
				...(data.controlText !== undefined && {
					controlText: data.controlText,
				}),
			})
			.where(eq(learnerMaps.id, existing.id));

		return true;
	}

	const learnerMapId = randomString();
	yield* db.insert(learnerMaps).values({
		id: learnerMapId,
		assignmentId: data.assignmentId,
		goalMapId: assignment.goalMapId,
		kitId: assignment.kitId,
		userId,
		nodes: data.nodes ?? null,
		edges: data.edges ?? null,
		controlText: data.controlText ?? null,
		status: "draft",
		attempt: 1,
	});

	return true;
});

export const submitLearnerMap = Effect.fn("submitLearnerMap")(function* (
	userId: string,
	input: SubmitLearnerMapInput,
) {
	const db = yield* Database;

	yield* requireAssignmentCondition(userId, input.assignmentId, "concept_map");

	const learnerMapRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const learnerMap = learnerMapRows[0];
	if (!learnerMap) {
		return yield* new LearnerMapNotFoundError({ assignmentId: input.assignmentId, userId });
	}

	if (learnerMap.status === "submitted") {
		return yield* new LearnerMapAlreadySubmittedError({ learnerMapId: learnerMap.id });
	}

	// Fetch assignment to get the correct goalMapId and form unlock configuration
	const assignmentRows = yield* db
		.select({
			goalMapId: assignments.goalMapId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
		})
		.from(assignments)
		.where(eq(assignments.id, input.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: input.assignmentId });
	}

	// Use assignment's goalMapId for comparison (not learnerMap.goalMapId which may be null for kits)
	const goalMapRows = yield* db
		.select({ edges: goalMaps.edges })
		.from(goalMaps)
		.where(eq(goalMaps.id, assignment.goalMapId))
		.limit(1);

	const goalMap = goalMapRows[0];
	if (!goalMap) {
		return yield* new GoalMapNotFoundError({ goalMapId: assignment.goalMapId });
	}

	const goalMapEdges = Array.isArray(goalMap.edges) ? goalMap.edges : [];
	const learnerEdges = Array.isArray(learnerMap.edges) ? learnerMap.edges : [];

	const diagnosis = compareMaps(goalMapEdges, learnerEdges);

	yield* db
		.update(learnerMaps)
		.set({
			status: "submitted",
			submittedAt: new Date(),
		})
		.where(eq(learnerMaps.id, learnerMap.id));

	const diagnosisId = randomString();
	yield* db.insert(diagnoses).values({
		id: diagnosisId,
		goalMapId: learnerMap.goalMapId,
		learnerMapId: learnerMap.id,
		summary: `Correct: ${diagnosis.correct.length}, Missing: ${diagnosis.missing.length}, Excessive: ${diagnosis.excessive.length}`,
		perLink: JSON.stringify(diagnosis),
		score: diagnosis.score,
		rubricVersion: "1.0",
	});

	return {
		diagnosisId,
		diagnosis,
	};
});

export const startNewAttempt = Effect.fn("startNewAttempt")(function* (
	userId: string,
	input: StartNewAttemptInput,
) {
	const db = yield* Database;

	const existingRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const existing = existingRows[0];
	if (!existing) {
		return yield* new NoPreviousAttemptError({ assignmentId: input.assignmentId });
	}

	if (existing.status !== "submitted") {
		return yield* new PreviousAttemptNotSubmittedError({ learnerMapId: existing.id });
	}

	yield* db
		.update(learnerMaps)
		.set({
			status: "draft",
			attempt: existing.attempt + 1,
			submittedAt: null,
		})
		.where(eq(learnerMaps.id, existing.id));

	return true;
});

export const submitControlText = Effect.fn("submitControlText")(function* (
	userId: string,
	input: SubmitControlTextInput,
) {
	const db = yield* Database;

	// Verify assignment exists and get form unlock configuration
	const assignmentRows = yield* db
		.select({
			id: assignments.id,
			goalMapId: assignments.goalMapId,
			kitId: assignments.kitId,
			postTestFormId: assignments.postTestFormId,
			delayedPostTestFormId: assignments.delayedPostTestFormId,
			delayedPostTestDelayDays: assignments.delayedPostTestDelayDays,
		})
		.from(assignments)
		.where(eq(assignments.id, input.assignmentId))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment) {
		return yield* new AssignmentNotFoundError({ assignmentId: input.assignmentId });
	}

	yield* requireAssignmentCondition(userId, input.assignmentId, "summarizing");

	const existingRows = yield* db
		.select({ id: learnerMaps.id, status: learnerMaps.status })
		.from(learnerMaps)
		.where(
			and(eq(learnerMaps.assignmentId, input.assignmentId), eq(learnerMaps.userId, userId)),
		)
		.limit(1);

	const existing = existingRows[0];
	if (existing?.status === "submitted") {
		return yield* new LearnerMapAlreadySubmittedError({ learnerMapId: existing.id });
	}

	if (existing) {
		yield* db
			.update(learnerMaps)
			.set({
				controlText: input.text,
				status: "submitted",
				submittedAt: new Date(),
			})
			.where(eq(learnerMaps.id, existing.id));
	} else {
		const learnerMapId = randomString();
		yield* db.insert(learnerMaps).values({
			id: learnerMapId,
			assignmentId: input.assignmentId,
			goalMapId: assignment.goalMapId,
			kitId: assignment.kitId,
			userId,
			controlText: input.text,
			nodes: null,
			edges: null,
			status: "submitted",
			attempt: 1,
			submittedAt: new Date(),
		});
	}

	return true;
});
