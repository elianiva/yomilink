import { Data, Schema } from "effect";

import { NonEmpty } from "@/lib/validation-schemas";

export const WhitelistLookupInput = Schema.Struct({
	studentId: NonEmpty("Student ID"),
});

export type WhitelistLookupInput = typeof WhitelistLookupInput.Type;

export const WhitelistImportInput = Schema.Struct({
	csvText: Schema.String,
});

export type WhitelistImportInput = typeof WhitelistImportInput.Type;

export const WhitelistCsvRow = Schema.Struct({
	studentId: NonEmpty("Student ID"),
	name: NonEmpty("Name"),
	cohortId: Schema.optionalWith(Schema.String, { nullable: true }),
});

export type WhitelistCsvRow = typeof WhitelistCsvRow.Type;

export type WhitelistEntryWithCohort = {
	id: string;
	studentId: string;
	name: string;
	cohortId: string | null;
	cohortName: string | null;
	claimedUserId: string | null;
	claimedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type WhitelistImportResult = {
	importedCount: number;
};

export class WhitelistNotFoundError extends Data.TaggedError("WhitelistNotFoundError")<{
	readonly studentId: string;
}> {}

export class WhitelistAlreadyClaimedError extends Data.TaggedError("WhitelistAlreadyClaimedError")<{
	readonly studentId: string;
}> {}

export class WhitelistImportFailedError extends Data.TaggedError("WhitelistImportFailedError")<{
	readonly message: string;
}> {}
