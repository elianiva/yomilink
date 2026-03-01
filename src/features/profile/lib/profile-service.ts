import { eq } from "drizzle-orm";
import { Data, Effect, Schema } from "effect";

import { Database } from "@/server/db/client";
import { user } from "@/server/db/schema/auth-schema";

export const ProfileSchema = Schema.Struct({
	name: Schema.NonEmptyString,
	age: Schema.NullOr(Schema.Number),
	jlptLevel: Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None")),
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
	mediaConsumption: Schema.NullOr(Schema.Number),
	motivation: Schema.NullOr(Schema.String),
});

export const JlptLevelSchema = Schema.Union(Schema.Literal("N5", "N4", "N3", "N2", "N1", "None"));

export type JlptLevel = typeof JlptLevelSchema.Type;

export const UpdateProfileInput = Schema.partial(ProfileSchema);

export type UpdateProfileInput = typeof UpdateProfileInput.Type;

export class UserNotFoundError extends Data.TaggedError("UserNotFoundError")<{
	readonly userId: string;
}> {}

export const updateProfile = Effect.fn("updateProfile")(function* (
	userId: string,
	data: UpdateProfileInput,
) {
	const db = yield* Database;

	const existingRows = yield* db.select().from(user).where(eq(user.id, userId)).limit(1);

	if (existingRows.length === 0) {
		return yield* new UserNotFoundError({ userId });
	}

	yield* db
		.update(user)
		.set({
			...(data.name !== undefined && { name: data.name }),
			...(data.age !== undefined && { age: data.age }),
			...(data.jlptLevel !== undefined && { jlptLevel: data.jlptLevel }),
			...(data.japaneseLearningDuration !== undefined && {
				japaneseLearningDuration: data.japaneseLearningDuration,
			}),
			...(data.previousJapaneseScore !== undefined && {
				previousJapaneseScore: data.previousJapaneseScore,
			}),
			...(data.mediaConsumption !== undefined && {
				mediaConsumption: data.mediaConsumption,
			}),
			...(data.motivation !== undefined && { motivation: data.motivation }),
		})
		.where(eq(user.id, userId));

	return { ok: true };
});
