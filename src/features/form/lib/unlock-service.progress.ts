import { format } from "date-fns";
import { and, eq, isNotNull } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { Database } from "@/server/db/client";
import { formProgress, learnerMaps } from "@/server/db/schema/app-schema";

export const UnlockFormInput = Schema.Struct({
	formId: Schema.String,
	userId: Schema.String,
});

export type UnlockFormInput = typeof UnlockFormInput.Type;

export const unlockForm = Effect.fn("unlockForm")(function* (input: UnlockFormInput) {
	const db = yield* Database;

	const existingProgress = yield* db
		.select()
		.from(formProgress)
		.where(and(eq(formProgress.formId, input.formId), eq(formProgress.userId, input.userId)))
		.limit(1);

	const now = new Date();

	if (existingProgress.length > 0) {
		yield* db
			.update(formProgress)
			.set({ status: "available", unlockedAt: now })
			.where(eq(formProgress.id, existingProgress[0].id));
	} else {
		yield* db.insert(formProgress).values({
			id: crypto.randomUUID(),
			formId: input.formId,
			userId: input.userId,
			status: "available",
			unlockedAt: now,
		});
	}

	return { formId: input.formId, userId: input.userId, unlockedAt: now };
});

export const GetFormProgressInput = Schema.Struct({
	formId: Schema.String,
	userId: Schema.String,
});

export type GetFormProgressInput = typeof GetFormProgressInput.Type;

export type FormProgressInfo = {
	id: string;
	formId: string;
	userId: string;
	status: "locked" | "available" | "completed";
	unlockedAt: Date | null;
	completedAt: Date | null;
};

export const getFormProgress = Effect.fn("getFormProgress")(function* (
	input: GetFormProgressInput,
) {
	const db = yield* Database;

	const progressRows = yield* db
		.select()
		.from(formProgress)
		.where(and(eq(formProgress.formId, input.formId), eq(formProgress.userId, input.userId)))
		.limit(1);

	if (progressRows.length === 0) {
		return null;
	}

	const p = progressRows[0];
	return {
		id: p.id,
		formId: p.formId,
		userId: p.userId,
		status: p.status,
		unlockedAt: p.unlockedAt,
		completedAt: p.completedAt,
	};
});

export const GetUserCompletedFormsInput = Schema.Struct({
	userId: Schema.String,
});

export type GetUserCompletedFormsInput = typeof GetUserCompletedFormsInput.Type;

export const getUserCompletedForms = Effect.fn("getUserCompletedForms")(function* (
	input: GetUserCompletedFormsInput,
) {
	const db = yield* Database;

	const completedForms = yield* db
		.select({ formId: formProgress.formId })
		.from(formProgress)
		.where(and(eq(formProgress.userId, input.userId), eq(formProgress.status, "completed")));

	return completedForms.map((f) => f.formId);
});

export const UnlockPostTestAfterAssignmentInput = Schema.Struct({
	assignmentId: Schema.String,
	userId: Schema.String,
	postTestFormId: Schema.String,
	delayDays: Schema.optionalWith(Schema.Number, { default: () => 0 }),
});

export type UnlockPostTestAfterAssignmentInput = typeof UnlockPostTestAfterAssignmentInput.Type;

export const unlockPostTestAfterAssignment = Effect.fn("unlockPostTestAfterAssignment")(function* (
	input: UnlockPostTestAfterAssignmentInput,
) {
	const db = yield* Database;

	const learnerMapRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(
				eq(learnerMaps.assignmentId, input.assignmentId),
				eq(learnerMaps.userId, input.userId),
				eq(learnerMaps.status, "submitted"),
				isNotNull(learnerMaps.submittedAt),
			),
		)
		.limit(1);

	if (learnerMapRows.length === 0) {
		return { scheduled: false, unlockedAt: null, reason: "Assignment not completed" };
	}

	const completedAt = learnerMapRows[0].submittedAt;
	if (!completedAt) {
		return { scheduled: false, unlockedAt: null, reason: "Assignment not completed" };
	}
	const now = new Date();

	if (input.delayDays > 0) {
		const unlockAt = new Date(completedAt);
		unlockAt.setDate(unlockAt.getDate() + input.delayDays);

		if (unlockAt > now) {
			return {
				scheduled: true,
				unlockAt: unlockAt.toISOString(),
				unlockedAt: null,
				reason: null,
			};
		}
	}

	const result = yield* unlockForm({ formId: input.postTestFormId, userId: input.userId });

	return { scheduled: false, unlockedAt: result.unlockedAt, reason: null };
});

export const CalculateDelayedUnlockInput = Schema.Struct({
	completedAt: Schema.String,
	delayDays: Schema.Number,
});

export type CalculateDelayedUnlockInput = typeof CalculateDelayedUnlockInput.Type;

export const calculateDelayedUnlock = Effect.fn("calculateDelayedUnlock")(
	(input: CalculateDelayedUnlockInput) =>
		Effect.sync(() => {
			const completedAt = new Date(input.completedAt);
			const unlockAt = new Date(completedAt);
			unlockAt.setDate(unlockAt.getDate() + input.delayDays);

			const now = new Date();
			const isUnlocked = unlockAt <= now;

			return {
				completedAt: input.completedAt,
				delayDays: input.delayDays,
				unlockAt: unlockAt.toISOString(),
				isUnlocked,
				formattedUnlockDate: format(unlockAt, "MMM d, yyyy"),
				formattedUnlockTime: format(unlockAt, "h:mm a"),
			};
		}),
);

export const GetAssignmentCompletionInput = Schema.Struct({
	assignmentId: Schema.String,
	userId: Schema.String,
});

export type GetAssignmentCompletionInput = typeof GetAssignmentCompletionInput.Type;

export type AssignmentCompletionStatus = {
	isCompleted: boolean;
	completedAt: Date | null;
	formId: string | null;
};

export const getAssignmentCompletionStatus = Effect.fn("getAssignmentCompletionStatus")(function* (
	input: GetAssignmentCompletionInput,
) {
	const db = yield* Database;

	const learnerMapRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(
				eq(learnerMaps.assignmentId, input.assignmentId),
				eq(learnerMaps.userId, input.userId),
				eq(learnerMaps.status, "submitted"),
				isNotNull(learnerMaps.submittedAt),
			),
		)
		.limit(1);

	if (learnerMapRows.length === 0) {
		return { isCompleted: false, completedAt: null, formId: null };
	}

	const map = learnerMapRows[0];
	return { isCompleted: true, completedAt: map.submittedAt, formId: map.id };
});
