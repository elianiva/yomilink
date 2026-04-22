import { Data, Schema } from "effect";

import { NonEmpty } from "@/lib/validation-schemas";

export const CreateAssignmentInput = Schema.Struct({
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	goalMapId: NonEmpty("Goal map ID"),
	startDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	endDate: Schema.optionalWith(Schema.Number, { nullable: true }),
	cohortIds: Schema.Array(NonEmpty("Cohort ID")),
	userIds: Schema.Array(NonEmpty("User ID")),
	preTestFormId: Schema.String,
	postTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	delayedPostTestFormId: Schema.optionalWith(Schema.String, { nullable: true }),
	delayedPostTestDelayDays: Schema.optionalWith(Schema.Number, {
		nullable: true,
	}),
	tamFormId: Schema.optionalWith(Schema.String, { nullable: true }),
});

export type CreateAssignmentInput = typeof CreateAssignmentInput.Type;

export const DeleteAssignmentInput = Schema.Struct({
	id: NonEmpty("Assignment ID"),
});

export type DeleteAssignmentInput = typeof DeleteAssignmentInput.Type;

export class AssignmentNotFoundError extends Data.TaggedError("AssignmentNotFoundError")<{
	readonly assignmentId: string;
}> {}

export class KitNotFoundError extends Data.TaggedError("KitNotFoundError")<{
	readonly goalMapId: string;
}> {}
