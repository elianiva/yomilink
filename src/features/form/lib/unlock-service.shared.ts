import { Effect, Schema } from "effect";

import { Database } from "@/server/db/client";
import { assignments, formProgress, forms, learnerMaps } from "@/server/db/schema/app-schema";

export const TimeBasedCondition = Schema.Struct({
	type: Schema.Literal("time"),
	unlockAt: Schema.String,
});

export const PrerequisiteCondition = Schema.Struct({
	type: Schema.Literal("prerequisite"),
	requiredFormId: Schema.String,
	requiredFormStatus: Schema.optionalWith(
		Schema.Union(Schema.Literal("completed"), Schema.Literal("available")),
		{ default: () => "completed" as const },
	),
});

export const ManualCondition = Schema.Struct({
	type: Schema.Literal("manual"),
});

export const AssignmentCondition = Schema.Struct({
	type: Schema.Literal("assignment"),
	assignmentId: Schema.String,
});

export const UnlockConditionSchema = Schema.Union(
	TimeBasedCondition,
	PrerequisiteCondition,
	ManualCondition,
	AssignmentCondition,
);

export const FormUnlockConditionsSchema = Schema.Struct({
	conditions: Schema.Array(UnlockConditionSchema),
	logic: Schema.optionalWith(Schema.Union(Schema.Literal("all"), Schema.Literal("any")), {
		default: () => "all" as const,
	}),
});

export type UnlockConditionType = Schema.Schema.Type<typeof UnlockConditionSchema>;
export type FormUnlockConditionsType = Schema.Schema.Type<typeof FormUnlockConditionsSchema>;

export const FormUnlockConditionsNullable = Schema.NullOr(FormUnlockConditionsSchema);

export class FormNotFoundError extends Schema.TaggedError("FormNotFoundError")<{
	readonly formId: string;
}> {}

type FormProgressRow = {
	status: "locked" | "available" | "completed";
	unlockedAt: Date | null;
	completedAt: Date | null;
};

export function pickProgress(rows: ReadonlyArray<FormProgressRow>) {
	return (
		rows.find((row) => row.status === "completed") ??
		rows.find((row) => row.status === "available") ??
		rows[0] ??
		null
	);
}
