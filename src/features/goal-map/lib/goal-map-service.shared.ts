import { Data, Schema } from "effect";

import { NonEmpty } from "@/lib/validation-schemas";

export const SaveGoalMapOutput = Schema.Struct({
	errors: Schema.Array(Schema.String),
	warnings: Schema.Array(Schema.String),
	propositions: Schema.Array(Schema.String),
	published: Schema.Boolean,
});

export type SaveGoalMapOutput = typeof SaveGoalMapOutput.Type;

export const NEW_GOAL_MAP_ID = "new";

export const PositionSchema = Schema.Struct({
	x: Schema.Number,
	y: Schema.Number,
});

export const NodeDataSchema = Schema.Struct({
	label: Schema.optionalWith(Schema.String, { nullable: true }),
	propositionType: Schema.optionalWith(Schema.String, { nullable: true }),
	description: Schema.optionalWith(Schema.String, { nullable: true }),
	examples: Schema.optionalWith(Schema.Array(Schema.String), {
		nullable: true,
	}),
});

export const EdgeDataSchema = Schema.Struct({
	label: Schema.optionalWith(Schema.String, { nullable: true }),
	relationshipType: Schema.optionalWith(Schema.String, { nullable: true }),
});

export const NodeSchema = Schema.Struct({
	id: Schema.String,
	type: Schema.optionalWith(Schema.String, { nullable: true }),
	position: PositionSchema,
	data: NodeDataSchema,
	width: Schema.optionalWith(Schema.Number, { nullable: true }),
	height: Schema.optionalWith(Schema.Number, { nullable: true }),
});

export const EdgeSchema = Schema.Struct({
	id: Schema.String,
	source: Schema.String,
	target: Schema.String,
	type: Schema.optionalWith(Schema.String, { nullable: true }),
	label: Schema.optionalWith(Schema.String, { nullable: true }),
	data: Schema.optionalWith(EdgeDataSchema, { nullable: true }),
});

export class GoalMapValidationError extends Data.TaggedError("GoalMapValidationError")<{
	errors: string[];
	warnings: string[];
}> {}

export class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export class GoalMapAccessDeniedError extends Data.TaggedError("GoalMapAccessDeniedError")<{
	readonly goalMapId: string;
	readonly userId: string;
}> {}

export const GetGoalMapInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
});

export type GetGoalMapInput = typeof GetGoalMapInput.Type;

export const SaveGoalMapInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
	title: NonEmpty("Title"),
	description: Schema.optionalWith(NonEmpty("Description"), {
		nullable: true,
	}),
	nodes: Schema.Array(NodeSchema),
	edges: Schema.Array(EdgeSchema),
	topicId: Schema.optionalWith(NonEmpty("Topic ID"), { nullable: true }),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(Schema.Array(Schema.Any), {
		nullable: true,
	}),
	publish: Schema.optionalWith(Schema.Boolean, { default: () => false }),
});

export type SaveGoalMapInput = typeof SaveGoalMapInput.Type;

export type GoalMap = {
	id: string;
	title: string;
	description: string | null;
	teacherId: string;
	topicId: string | null;
	kitId?: string | null;
	nodes: readonly Schema.Schema.Type<typeof NodeSchema>[];
	edges: readonly Schema.Schema.Type<typeof EdgeSchema>[];
	createdAt: number | undefined;
	updatedAt: number | undefined;
};

export const ListGoalMapsByTopicInput = Schema.Struct({
	topicId: Schema.optionalWith(NonEmpty("Topic ID"), { nullable: true }),
});

export type ListGoalMapsByTopicInput = typeof ListGoalMapsByTopicInput.Type;

export const DeleteGoalMapInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
});

export type DeleteGoalMapInput = typeof DeleteGoalMapInput.Type;

export const UpdateMaterialInput = Schema.Struct({
	goalMapId: NonEmpty("Goal map ID"),
	materialText: Schema.optionalWith(Schema.String, { nullable: true }),
	materialImages: Schema.optionalWith(Schema.Array(Schema.Any), { nullable: true }),
});

export type UpdateMaterialInput = typeof UpdateMaterialInput.Type;
