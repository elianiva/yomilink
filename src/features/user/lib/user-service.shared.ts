import { Data, Schema } from "effect";

import { NonEmpty } from "@/lib/validation-schemas";

export const Role = Schema.Literal("teacher", "admin", "student");

export type Role = typeof Role.Type;

export const UserFilterInput = Schema.Struct({
	search: Schema.optional(Schema.String),
	role: Schema.optional(Role),
	banned: Schema.optional(Schema.Boolean),
	cohortId: Schema.optional(Schema.String),
	page: Schema.optionalWith(Schema.Number, { default: () => 1 }),
	pageSize: Schema.optionalWith(Schema.Number, { default: () => 20 }),
});

export type UserFilterInput = typeof UserFilterInput.Type;

export const UpdateUserInput = Schema.Struct({
	name: Schema.optional(NonEmpty("Name")),
	email: Schema.optional(Schema.String),
	studentId: Schema.optionalWith(Schema.String, { nullable: true }),
	age: Schema.optionalWith(Schema.Number, { nullable: true }),
	jlptLevel: Schema.optionalWith(
		Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None")),
		{ nullable: true },
	),
	japaneseLearningDuration: Schema.optionalWith(Schema.Number, { nullable: true }),
	previousJapaneseScore: Schema.optionalWith(Schema.Number, { nullable: true }),
	mediaConsumption: Schema.optionalWith(Schema.Number, { nullable: true }),
	motivation: Schema.optionalWith(Schema.String, { nullable: true }),
	studyGroup: Schema.optionalWith(
		Schema.Union(Schema.Literal("experiment", "control")),
		{ nullable: true },
	),
});

export type UpdateUserInput = typeof UpdateUserInput.Type;

export const BanUserInput = Schema.Struct({
	userId: Schema.String,
	reason: NonEmpty("Reason"),
	expiresAt: Schema.optional(Schema.Date),
});

export type BanUserInput = typeof BanUserInput.Type;

export const BulkCohortAssignInput = Schema.Struct({
	userIds: Schema.Array(Schema.String),
	cohortId: Schema.String,
	action: Schema.Literal("add", "remove"),
});

export type BulkCohortAssignInput = typeof BulkCohortAssignInput.Type;

export const UpdateRoleInput = Schema.Struct({
	userId: Schema.String,
	role: Role,
});

export type UpdateRoleInput = typeof UpdateRoleInput.Type;

export type UserWithCohorts = {
	id: string;
	name: string;
	email: string;
	studentId: string | null;
	role: string | null;
	image: string | null;
	banned: boolean | null;
	banReason: string | null;
	banExpires: Date | null;
	createdAt: Date;
	age: number | null;
	jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1" | "None" | null;
	japaneseLearningDuration: number | null;
	previousJapaneseScore: number | null;
	mediaConsumption: number | null;
	motivation: string | null;
	studyGroup: "experiment" | "control" | null;
	cohorts: { id: string; name: string }[];
};

export type UserListResult = {
	users: UserWithCohorts[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
	readonly userId: string;
}> {}

export class CannotModifySelfError extends Data.TaggedError("CannotModifySelfError")<{
	readonly message: string;
}> {}

export class LastAdminError extends Data.TaggedError("LastAdminError")<{
	readonly message: string;
}> {}
