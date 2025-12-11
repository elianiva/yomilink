import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import { goalMaps, kits } from "@/server/db/schema";
import { Database } from "../db/client";

const StudentKitSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	updatedAt: Schema.Number,
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const listStudentKits = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* Effect.tryPromise(() =>
				db
					.select({
						goalMapId: goalMaps.goalMapId,
						title: goalMaps.title,
						description: goalMaps.description,
						updatedAt: goalMaps.updatedAt,
						teacherId: goalMaps.teacherId,
					})
					.from(goalMaps)
					.leftJoin(kits, eq(kits.goalMapId, goalMaps.goalMapId))
					.orderBy(desc(goalMaps.updatedAt))
					.all(),
			);
			return yield* Schema.decodeUnknown(Schema.Array(StudentKitSchema))(rows);
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("listStudentKits"),
			Effect.runPromise,
		),
	);

const GetKitSchema = Schema.Struct({
	kitId: Schema.NonEmptyString,
});

const KitResultSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	nodes: Schema.Array(Schema.Any),
	edges: Schema.Array(Schema.Any),
});

export const getKit = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const row = yield* Effect.tryPromise(() =>
				db
					.select({
						goalMapId: goalMaps.goalMapId,
						nodes: kits.nodes,
						edges: kits.edges,
					})
					.from(kits)
					.leftJoin(goalMaps, eq(kits.goalMapId, goalMaps.goalMapId))
					.where(eq(kits.goalMapId, data.kitId))
					.get(),
			);
			if (!row) return null;

			const result = yield* Schema.decodeUnknown(KitResultSchema)(row);
			return result;
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("getKit"),
			Effect.runPromise,
		),
	);

const GenerateKitSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
});

export const generateKit = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GenerateKitSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const gm = yield* Effect.tryPromise(() =>
				db
					.select()
					.from(goalMaps)
					.where(eq(goalMaps.goalMapId, data.goalMapId))
					.get(),
			);
			if (!gm) return { ok: false } as const;

			const nodes = safeParseJson(gm.nodes) ?? [];
			const edges = safeParseJson(gm.edges) ?? [];
			const conceptIds = new Set(
				(nodes as any[])
					.filter((n) => n?.type === "text" || n?.type === "image")
					.map((n) => n.id),
			);
			const kitNodes = (nodes as any[]).filter(
				(n) => n?.type === "text" || n?.type === "image",
			);
			const kitEdges = (edges as any[]).filter(
				(e) => conceptIds.has(e?.source) && conceptIds.has(e?.target),
			);

			const payload = {
				id: data.goalMapId,
				goalMapId: data.goalMapId,
				createdBy: gm.teacherId ?? "",
				nodes: JSON.stringify(kitNodes),
				edges: JSON.stringify(kitEdges),
				constraints: null as any,
				version: 1,
				createdAt: Date.now(),
			};

			const existing = yield* Effect.tryPromise(() =>
				db
					.select({ id: kits.id })
					.from(kits)
					.where(eq(kits.goalMapId, data.goalMapId))
					.get(),
			);

			if (existing) {
				yield* Effect.tryPromise(() =>
					db
						.update(kits)
						.set({
							id: payload.id,
							goalMapId: payload.goalMapId,
							createdBy: payload.createdBy,
							nodes: payload.nodes,
							edges: payload.edges,
							constraints: null,
							version: payload.version,
							createdAt: payload.createdAt,
						})
						.where(eq(kits.goalMapId, data.goalMapId))
						.run(),
				);
			} else {
				yield* Effect.tryPromise(() => db.insert(kits).values(payload).run());
			}
			return { ok: true, kitId: data.goalMapId } as const;
		}).pipe(
			Effect.provide(Database.Default),
			Effect.withSpan("generateKit"),
			Effect.runPromise,
		),
	);

function safeParseJson(s?: string | null) {
	try {
		return s ? JSON.parse(s) : null;
	} catch {
		return null;
	}
}
