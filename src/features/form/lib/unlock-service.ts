import { and, eq, isNotNull } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";
import { Database } from "@/server/db/client";
import {
	formProgress,
	forms,
	learnerMaps,
} from "@/server/db/schema/app-schema";

const TimeBasedCondition = Schema.Struct({
	type: Schema.Literal("time"),
	unlockAt: Schema.String,
});

const PrerequisiteCondition = Schema.Struct({
	type: Schema.Literal("prerequisite"),
	requiredFormId: Schema.String,
	requiredFormStatus: Schema.optionalWith(
		Schema.Union(Schema.Literal("completed"), Schema.Literal("available")),
		{ default: () => "completed" as const },
	),
});

const ManualCondition = Schema.Struct({
	type: Schema.Literal("manual"),
});

const UnlockConditionSchema = Schema.Union(
	TimeBasedCondition,
	PrerequisiteCondition,
	ManualCondition,
);

const FormUnlockConditions = Schema.Struct({
	conditions: Schema.Array(UnlockConditionSchema),
	logic: Schema.optionalWith(
		Schema.Union(Schema.Literal("all"), Schema.Literal("any")),
		{ default: () => "all" as const },
	),
});

type UnlockConditionType = Schema.Schema.Type<typeof UnlockConditionSchema>;
type FormUnlockConditionsType = Schema.Schema.Type<typeof FormUnlockConditions>;

export type { UnlockConditionType as UnlockCondition };
export type { FormUnlockConditionsType as FormUnlockConditions };

export class FormNotFoundError extends Data.TaggedError("FormNotFoundError")<{
	readonly formId: string;
}> {}

export const checkTimeBasedCondition = Effect.fn("checkTimeBasedCondition")(
	(condition: UnlockConditionType) =>
		Effect.gen(function* () {
			const result = yield* Effect.sync(() => {
				const isTimeCondition =
					"unlockAt" in condition &&
					(condition as { type?: string }).type === "time";
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
		}),
);

export const checkPrerequisiteCondition = Effect.fn(
	"checkPrerequisiteCondition",
)((condition: UnlockConditionType, userId: string) =>
	Effect.gen(function* () {
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
			.select()
			.from(formProgress)
			.where(
				and(
					eq(formProgress.formId, condition.requiredFormId),
					eq(formProgress.userId, userId),
				),
			)
			.limit(1);

		const progress = progressRows[0];

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
			reason: isUnlocked
				? null
				: `Complete "${requiredFormRows[0].title}" first`,
			unlockAt: null as string | null,
		};
	}),
);

export const checkManualCondition = Effect.fn("checkManualCondition")(
	(condition: UnlockConditionType, userId: string, formId: string) =>
		Effect.gen(function* () {
			if (condition.type !== "manual") {
				return {
					isUnlocked: false,
					reason: "Invalid condition type",
					unlockAt: null as string | null,
				};
			}

			const db = yield* Database;

			const progressRows = yield* db
				.select()
				.from(formProgress)
				.where(
					and(eq(formProgress.formId, formId), eq(formProgress.userId, userId)),
				)
				.limit(1);

			const progress = progressRows[0];

			const isUnlocked = progress
				? progress.status === "available" || progress.status === "completed"
				: false;

			return {
				isUnlocked,
				reason: isUnlocked ? null : "Manually unlock required",
				unlockAt: null as string | null,
			};
		}),
);

const checkUnlockCondition = Effect.fn("checkUnlockCondition")(
	(condition: UnlockConditionType, userId: string, formId: string) =>
		Effect.gen(function* () {
			if (condition.type === "time") {
				return yield* checkTimeBasedCondition(condition);
			}
			if (condition.type === "prerequisite") {
				return yield* checkPrerequisiteCondition(condition, userId);
			}
			if (condition.type === "manual") {
				return yield* checkManualCondition(condition, userId, formId);
			}
			return {
				isUnlocked: false,
				reason: "Unknown condition type",
				unlockAt: null as string | null,
			};
		}),
);

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

export const checkFormUnlock = Effect.fn("checkFormUnlock")(
	(input: CheckFormUnlockInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const formRows = yield* db
				.select()
				.from(forms)
				.where(eq(forms.id, input.formId))
				.limit(1);

			if (formRows.length === 0) {
				return yield* new FormNotFoundError({ formId: input.formId });
			}

			const form = formRows[0];
			const unlockConditions =
				form.unlockConditions as FormUnlockConditionsType | null;

			if (!unlockConditions || unlockConditions.conditions.length === 0) {
				return {
					isUnlocked: true,
					reason: null,
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
				logic === "all"
					? results.every((r) => r.isUnlocked)
					: results.some((r) => r.isUnlocked);

			const resultsWithDates = results.filter(
				(r): r is typeof r & { unlockAt: string } =>
					!r.isUnlocked && r.unlockAt !== null,
			);
			resultsWithDates.sort((a, b) => a.unlockAt.localeCompare(b.unlockAt));
			const earliestUnlockAt = resultsWithDates[0]?.unlockAt ?? null;

			const failedReason = results.find((r) => !r.isUnlocked)?.reason;

			return {
				isUnlocked,
				reason: isUnlocked ? null : failedReason,
				earliestUnlockAt,
			};
		}),
);

export const UnlockFormInput = Schema.Struct({
	formId: Schema.String,
	userId: Schema.String,
});

export type UnlockFormInput = typeof UnlockFormInput.Type;

export const unlockForm = Effect.fn("unlockForm")((input: UnlockFormInput) =>
	Effect.gen(function* () {
		const db = yield* Database;

		const existingProgress = yield* db
			.select()
			.from(formProgress)
			.where(
				and(
					eq(formProgress.formId, input.formId),
					eq(formProgress.userId, input.userId),
				),
			)
			.limit(1);

		const now = new Date();

		if (existingProgress.length > 0) {
			yield* db
				.update(formProgress)
				.set({
					status: "available",
					unlockedAt: now,
				})
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
	}),
);

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

export const getFormProgress = Effect.fn("getFormProgress")(
	(input: GetFormProgressInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const progressRows = yield* db
				.select()
				.from(formProgress)
				.where(
					and(
						eq(formProgress.formId, input.formId),
						eq(formProgress.userId, input.userId),
					),
				)
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
		}),
);

export const GetUserCompletedFormsInput = Schema.Struct({
	userId: Schema.String,
});

export type GetUserCompletedFormsInput = typeof GetUserCompletedFormsInput.Type;

export const getUserCompletedForms = Effect.fn("getUserCompletedForms")(
	(input: GetUserCompletedFormsInput) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const completedForms = yield* db
				.select({ formId: formProgress.formId })
				.from(formProgress)
				.where(
					and(
						eq(formProgress.userId, input.userId),
						eq(formProgress.status, "completed"),
					),
				);

			return completedForms.map((f) => f.formId);
		}),
);

// ============================================================================
// Post-Test Unlock Service
// Unlocks post-test forms when assignments are completed
// ============================================================================

export const UnlockPostTestAfterAssignmentInput = Schema.Struct({
	assignmentId: Schema.String,
	userId: Schema.String,
	postTestFormId: Schema.String,
	delayDays: Schema.optionalWith(Schema.Number, { default: () => 0 }),
});

export type UnlockPostTestAfterAssignmentInput =
	typeof UnlockPostTestAfterAssignmentInput.Type;

export const unlockPostTestAfterAssignment = Effect.fn(
	"unlockPostTestAfterAssignment",
)((input: UnlockPostTestAfterAssignmentInput) =>
	Effect.gen(function* () {
		const db = yield* Database;

		// Check if the assignment was submitted by checking learner_maps
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
			return {
				success: false,
				reason: "Assignment not completed",
			};
		}

		const completedAt = learnerMapRows[0].submittedAt;
		if (!completedAt) {
			return {
				success: false,
				reason: "Assignment not completed",
			};
		}
		const now = new Date();

		// If delay is specified, schedule the unlock for future
		if (input.delayDays > 0) {
			const unlockAt = new Date(completedAt);
			unlockAt.setDate(unlockAt.getDate() + input.delayDays);

			// Check if unlock time has passed
			if (unlockAt > now) {
				return {
					success: true,
					scheduled: true,
					unlockAt: unlockAt.toISOString(),
					message: `Post-test will be available on ${unlockAt.toLocaleDateString()}`,
				};
			}
		}

		// Unlock immediately
		const result = yield* unlockForm({
			formId: input.postTestFormId,
			userId: input.userId,
		});

		return {
			success: true,
			scheduled: false,
			unlockedAt: result.unlockedAt,
		};
	}),
);

// ============================================================================
// Delayed Test Scheduler Service
// Calculates unlock time as completion time + configurable delay
// ============================================================================

export const CalculateDelayedUnlockInput = Schema.Struct({
	completedAt: Schema.String, // ISO date string
	delayDays: Schema.Number,
});

export type CalculateDelayedUnlockInput =
	typeof CalculateDelayedUnlockInput.Type;

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
				formattedUnlockDate: unlockAt.toLocaleDateString(),
				formattedUnlockTime: unlockAt.toLocaleTimeString(),
			};
		}),
);

// ============================================================================
// Get Assignment Completion Status
// Checks if an assignment has been completed (submitted)
// ============================================================================

export const GetAssignmentCompletionInput = Schema.Struct({
	assignmentId: Schema.String,
	userId: Schema.String,
});

export type GetAssignmentCompletionInput =
	typeof GetAssignmentCompletionInput.Type;

export type AssignmentCompletionStatus = {
	isCompleted: boolean;
	completedAt: Date | null;
	formId: string | null;
};

export const getAssignmentCompletionStatus = Effect.fn(
	"getAssignmentCompletionStatus",
)((input: GetAssignmentCompletionInput) =>
	Effect.gen(function* () {
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
			return {
				isCompleted: false,
				completedAt: null,
				formId: null,
			};
		}

		const map = learnerMapRows[0];
		return {
			isCompleted: true,
			completedAt: map.submittedAt,
			formId: map.id,
		};
	}),
);
