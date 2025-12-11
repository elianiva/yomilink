import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import { goalMaps } from "@/server/db/schema/app-schema";
import { Database } from "../db/client";

const GetGoalMapSchema = Schema.Struct({
	id: Schema.NonEmptyString,
});

const GoalMapResultSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.Array(Schema.Any),
	edges: Schema.Array(Schema.Any),
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const getGoalMap = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetGoalMapSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const row = yield* Effect.tryPromise(() =>
				db.select().from(goalMaps).where(eq(goalMaps.goalMapId, data.id)).get(),
			);
			if (!row) return null;

			const result = yield* Schema.decodeUnknown(GoalMapResultSchema)(row);
			return result;
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("getGoalMap"),
			Effect.runPromise,
		),
	);

const SaveGoalMapSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	nodes: Schema.Array(Schema.Any),
	edges: Schema.Array(Schema.Any),
	updatedAt: Schema.optionalWith(Schema.Number, { nullable: true }),
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const saveGoalMap = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(SaveGoalMapSchema)(raw))
	.handler(async ({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const payload = {
				id: data.goalMapId,
				goalMapId: data.goalMapId,
				title: data.title,
				description: data.description ?? null,
				nodes: JSON.stringify(data.nodes ?? []),
				edges: JSON.stringify(data.edges ?? []),
				updatedAt: data.updatedAt ?? Date.now(),
				teacherId: data.teacherId ?? "",
			};

			yield* Effect.tryPromise(() =>
				db
					.insert(goalMaps)
					.values(payload)
					.onConflictDoUpdate({
						where: eq(goalMaps.goalMapId, data.goalMapId),
						target: goalMaps.id,
						set: payload,
					})
					.run(),
			);
		}).pipe(
			Effect.withSpan("saveGoalMap"),
			Effect.provide(Database.Default),
			Effect.runPromise,
		),
	);
