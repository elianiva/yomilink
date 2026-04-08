import { and, eq, isNotNull } from "drizzle-orm";
import { Effect, Schema } from "effect";

import { safeParseJson } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { assignments, formProgress, forms, learnerMaps } from "@/server/db/schema/app-schema";

import {
	FormNotFoundError,
	FormUnlockConditionsNullable,
	pickProgress,
	type UnlockConditionType,
} from "./unlock-service.shared";

export const checkTimeBasedCondition = Effect.fn("checkTimeBasedCondition")(function* (
	condition: UnlockConditionType,
) {
	const result = yield* Effect.sync(() => {
		const isTimeCondition =
			"unlockAt" in condition && (condition as { type?: string }).type === "time";
		if (!isTimeCondition) {
			return {
				isUnlocked: false,
				reason: "Invalid condition type",
				unlockAt: null as string | null,
			};
		}
		const unlockAtValue = (condition as { unlockAt: string }).unlockAt;
		const now = new Date();
		const unlockAt = new Date(unlockAtValue);
		const isUnlocked = unlockAt <= now;

		return {
			isUnlocked,
			reason: isUnlocked ? null : `Unlocks at ${unlockAt.toLocaleString()}`,
			unlockAt: isUnlocked ? null : unlockAtValue,
		};
	});
	return result;
});

export const checkPrerequisiteCondition = Effect.fn("checkPrerequisiteCondition")(function* (
	condition: UnlockConditionType,
	userId: string,
) {
	if (condition.type !== "prerequisite") {
		return {
			isUnlocked: false,
			reason: "Invalid condition type",
			unlockAt: null as string | null,
		};
	}

	const db = yield* Database;

	const requiredFormRows = yield* db
		.select()
		.from(forms)
		.where(eq(forms.id, condition.requiredFormId))
		.limit(1);

	if (requiredFormRows.length === 0) {
		return {
			isUnlocked: false,
			reason: "Required form not found",
			unlockAt: null as string | null,
		};
	}

	const progressRows = yield* db
		.select({
			status: formProgress.status,
			unlockedAt: formProgress.unlockedAt,
			completedAt: formProgress.completedAt,
		})
		.from(formProgress)
		.where(
			and(eq(formProgress.formId, condition.requiredFormId), eq(formProgress.userId, userId)),
		);

	const progress = pickProgress(progressRows);

	if (!progress) {
		return {
			isUnlocked: false,
			reason: `Complete "${requiredFormRows[0].title}" first`,
			unlockAt: null as string | null,
		};
	}

	const isUnlocked =
		condition.requiredFormStatus === "completed"
			? progress.status === "completed"
			: progress.status !== "locked";

	return {
		isUnlocked,
		reason: isUnlocked ? null : `Complete "${requiredFormRows[0].title}" first`,
		unlockAt: null as string | null,
	};
});

export const checkManualCondition = Effect.fn("checkManualCondition")(function* (
	condition: UnlockConditionType,
	userId: string,
	formId: string,
) {
	if (condition.type !== "manual") {
		return {
			isUnlocked: false,
			reason: "Invalid condition type",
			unlockAt: null as string | null,
		};
	}

	const db = yield* Database;

	const progressRows = yield* db
		.select({
			status: formProgress.status,
			unlockedAt: formProgress.unlockedAt,
			completedAt: formProgress.completedAt,
		})
		.from(formProgress)
		.where(and(eq(formProgress.formId, formId), eq(formProgress.userId, userId)));

	const progress = pickProgress(progressRows);
	const isUnlocked = progress
		? progress.status === "available" || progress.status === "completed"
		: false;

	return {
		isUnlocked,
		reason: isUnlocked ? null : "Manually unlock required",
		unlockAt: null as string | null,
	};
});

export const checkAssignmentCondition = Effect.fn("checkAssignmentCondition")(function* (
	condition: UnlockConditionType,
	userId: string,
) {
	if (condition.type !== "assignment") {
		return {
			isUnlocked: false,
			reason: "Invalid condition type",
			unlockAt: null as string | null,
		};
	}

	const db = yield* Database;
	const assignmentId = (condition as { assignmentId: string }).assignmentId;

	const learnerMapRows = yield* db
		.select()
		.from(learnerMaps)
		.where(
			and(
				eq(learnerMaps.assignmentId, assignmentId),
				eq(learnerMaps.userId, userId),
				eq(learnerMaps.status, "submitted"),
				isNotNull(learnerMaps.submittedAt),
			),
		)
		.limit(1);

	const isUnlocked = learnerMapRows.length > 0;

	return {
		isUnlocked,
		reason: isUnlocked ? null : "Complete the assignment tasks first",
		unlockAt: null as string | null,
	};
});

export const checkUnlockCondition = Effect.fn("checkUnlockCondition")(function* (
	condition: UnlockConditionType,
	userId: string,
	formId: string,
) {
	if (condition.type === "time") {
		return yield* checkTimeBasedCondition(condition);
	}
	if (condition.type === "prerequisite") {
		return yield* checkPrerequisiteCondition(condition, userId);
	}
	if (condition.type === "manual") {
		return yield* checkManualCondition(condition, userId, formId);
	}
	if (condition.type === "assignment") {
		return yield* checkAssignmentCondition(condition, userId);
	}
	return { isUnlocked: false, reason: "Unknown condition type", unlockAt: null as string | null };
});

export const CheckFormUnlockInput = Schema.Struct({
	formId: Schema.String,
	userId: Schema.String,
});

export type CheckFormUnlockInput = typeof CheckFormUnlockInput.Type;

export type CheckFormUnlockResult = {
	isUnlocked: boolean;
	reason: string | null;
	earliestUnlockAt: string | null;
};

export const checkFormUnlock = Effect.fn("checkFormUnlock")(function* (
	input: CheckFormUnlockInput,
) {
	const db = yield* Database;

	const formRows = yield* db.select().from(forms).where(eq(forms.id, input.formId)).limit(1);

	if (formRows.length === 0) {
		return yield* FormNotFoundError.make({ formId: input.formId });
	}

	const form = formRows[0];
	const unlockConditions = yield* safeParseJson(
		form.unlockConditions,
		null,
		FormUnlockConditionsNullable,
	);

	if (!unlockConditions || unlockConditions.conditions.length === 0) {
		if (form.type === "post_test" || form.type === "delayed_test") {
			const assignmentRows = yield* db
				.select()
				.from(assignments)
				.where(
					form.type === "post_test"
						? eq(assignments.postTestFormId, input.formId)
						: eq(assignments.delayedPostTestFormId, input.formId),
				)
				.limit(1);

			if (assignmentRows.length > 0) {
				const assignment = assignmentRows[0];
				const submittedMapRows = yield* db
					.select()
					.from(learnerMaps)
					.where(
						and(
							eq(learnerMaps.assignmentId, assignment.id),
							eq(learnerMaps.userId, input.userId),
							eq(learnerMaps.status, "submitted"),
							isNotNull(learnerMaps.submittedAt),
						),
					)
					.limit(1);

				const isUnlocked = submittedMapRows.length > 0;

				if (
					isUnlocked &&
					form.type === "delayed_test" &&
					assignment.delayedPostTestDelayDays
				) {
					const submittedAt = submittedMapRows[0].submittedAt;
					if (submittedAt) {
						const unlockAt = new Date(submittedAt);
						unlockAt.setDate(unlockAt.getDate() + assignment.delayedPostTestDelayDays);
						const now = new Date();
						const isTimeUnlocked = unlockAt <= now;

						return {
							isUnlocked: isTimeUnlocked,
							reason: isTimeUnlocked
								? null
								: `Available after ${unlockAt.toLocaleDateString()}`,
							earliestUnlockAt: isTimeUnlocked ? null : unlockAt.toISOString(),
						};
					}
				}

				return {
					isUnlocked,
					reason: isUnlocked ? null : "Complete the assignment tasks first",
					earliestUnlockAt: null,
				};
			}
		}

		const progressRows = yield* db
			.select({
				status: formProgress.status,
				unlockedAt: formProgress.unlockedAt,
				completedAt: formProgress.completedAt,
			})
			.from(formProgress)
			.where(
				and(eq(formProgress.formId, input.formId), eq(formProgress.userId, input.userId)),
			);

		const progress = pickProgress(progressRows);
		const isCompleted = progress?.status === "completed";

		return {
			isUnlocked: isCompleted,
			reason: isCompleted ? null : `Complete "${form.title}" first`,
			earliestUnlockAt: null,
		};
	}

	const results = yield* Effect.all(
		unlockConditions.conditions.map((condition) =>
			checkUnlockCondition(condition, input.userId, input.formId),
		),
		{ concurrency: "unbounded" },
	);

	const logic = unlockConditions.logic ?? "all";
	const isUnlocked =
		logic === "all" ? results.every((r) => r.isUnlocked) : results.some((r) => r.isUnlocked);

	const resultsWithDates = results.filter(
		(r): r is typeof r & { unlockAt: string } => !r.isUnlocked && r.unlockAt !== null,
	);
	resultsWithDates.sort((a, b) => a.unlockAt.localeCompare(b.unlockAt));
	const earliestUnlockAt = resultsWithDates[0]?.unlockAt ?? null;

	const failedReason = results.find((r) => !r.isUnlocked)?.reason;

	return { isUnlocked, reason: isUnlocked ? null : failedReason, earliestUnlockAt };
});
