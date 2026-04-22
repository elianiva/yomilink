import { and, eq, inArray, or } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { PerLinkDiagnosisSchema } from "@/features/analyzer/lib/analytics-service.shared";
import { NonEmpty } from "@/lib/validation-schemas";
import { Database } from "@/server/db/client";
import { assignments, assignmentTargets } from "@/server/db/schema/app-schema";
import { cohortMembers, user } from "@/server/db/schema/auth-schema";

export { PerLinkDiagnosisSchema };

export class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}

export class LearnerMapNotFoundError extends Data.TaggedError("LearnerMapNotFoundError")<{
	readonly assignmentId: string;
	readonly userId: string;
}> {}

export class LearnerMapAlreadySubmittedError extends Data.TaggedError(
	"LearnerMapAlreadySubmittedError",
)<{
	readonly learnerMapId: string;
}> {}

export class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export class AccessDeniedError extends Data.TaggedError("AccessDeniedError")<{
	readonly assignmentId: string;
}> {}

export class NoPreviousAttemptError extends Data.TaggedError("NoPreviousAttemptError")<{
	readonly assignmentId: string;
}> {}

export class PreviousAttemptNotSubmittedError extends Data.TaggedError(
	"PreviousAttemptNotSubmittedError",
)<{
	readonly learnerMapId: string;
}> {}

export const GetAssignmentForStudentInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetAssignmentForStudentInput = typeof GetAssignmentForStudentInput.Type;

export const SaveLearnerMapInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
	nodes: Schema.optionalWith(Schema.String, { nullable: true }),
	edges: Schema.optionalWith(Schema.String, { nullable: true }),
	controlText: Schema.optionalWith(Schema.String, { nullable: true }),
});

export type SaveLearnerMapInput = typeof SaveLearnerMapInput.Type;

export const SubmitLearnerMapInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type SubmitLearnerMapInput = typeof SubmitLearnerMapInput.Type;

export const GetDiagnosisInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetDiagnosisInput = typeof GetDiagnosisInput.Type;

export const StartNewAttemptInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type StartNewAttemptInput = typeof StartNewAttemptInput.Type;

export const GetPeerStatsInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
});

export type GetPeerStatsInput = typeof GetPeerStatsInput.Type;

export const SubmitControlTextInput = Schema.Struct({
	assignmentId: NonEmpty("Assignment ID"),
	text: NonEmpty("Text"),
});

export type SubmitControlTextInput = typeof SubmitControlTextInput.Type;

export type ExperimentCondition = "summarizing" | "concept_map";

export function mapStudyGroupToCondition(
	studyGroup: "experiment" | "control" | null,
): ExperimentCondition {
	return studyGroup === "experiment" ? "concept_map" : "summarizing";
}

export const getAssignmentMembership = Effect.fn("getAssignmentMembership")(function* (
	userId: string,
	assignmentId: string,
) {
	const db = yield* Database;

	const userCohorts = yield* db
		.select({ cohortId: cohortMembers.cohortId })
		.from(cohortMembers)
		.where(eq(cohortMembers.userId, userId));

	const cohortIds = userCohorts.map((c) => c.cohortId);

	const membershipRows = yield* db
		.select({ id: assignments.id })
		.from(assignments)
		.leftJoin(assignmentTargets, eq(assignmentTargets.assignmentId, assignments.id))
		.where(
			and(
				eq(assignments.id, assignmentId),
				or(
					eq(assignmentTargets.userId, userId),
					cohortIds.length > 0
						? inArray(assignmentTargets.cohortId, cohortIds)
						: eq(assignmentTargets.userId, ""),
				),
			),
		)
		.limit(1);

	const userRows = yield* db
		.select({ studyGroup: user.studyGroup })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	return {
		hasAccess: membershipRows.length > 0,
		condition: mapStudyGroupToCondition(userRows[0]?.studyGroup ?? null),
	};
});

export const requireAssignmentMembership = Effect.fn("requireAssignmentMembership")(function* (
	userId: string,
	assignmentId: string,
) {
	const membership = yield* getAssignmentMembership(userId, assignmentId);
	if (!membership.hasAccess) {
		return yield* new AccessDeniedError({ assignmentId });
	}

	return membership;
});

export const requireAssignmentCondition = Effect.fn("requireAssignmentCondition")(function* (
	userId: string,
	assignmentId: string,
	expectedCondition: ExperimentCondition,
) {
	const membership = yield* requireAssignmentMembership(userId, assignmentId);
	if (membership.condition !== expectedCondition) {
		return yield* new AccessDeniedError({ assignmentId });
	}

	return membership;
});
