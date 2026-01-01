import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { desc, eq } from "drizzle-orm";
import { Data, Effect, Layer, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import { requireTeacher } from "@/lib/auth-authorization";
import { goalMaps, kits } from "@/server/db/schema/app-schema";
import { Database, DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

class GoalMapNotFoundError extends Data.TaggedError("GoalMapNotFoundError")<{
	readonly goalMapId: string;
}> {}

export const StudentKitSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	title: Schema.NonEmptyString,
	description: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	updatedAt: Schema.Number,
	teacherId: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
});

export const listStudentKits = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					goalMapId: goalMaps.id,
					title: goalMaps.title,
					description: goalMaps.description,
					updatedAt: goalMaps.updatedAt,
					teacherId: goalMaps.teacherId,
				})
				.from(goalMaps)
				.leftJoin(kits, eq(kits.goalMapId, goalMaps.id))
				.orderBy(desc(goalMaps.updatedAt));

			return yield* Schema.decodeUnknown(Schema.Array(StudentKitSchema))(rows);
		}).pipe(
			Effect.tapError(logRpcError("listStudentKits")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listStudentKits"),
			Effect.runPromise,
		),
	);

const GetKitSchema = Schema.Struct({
	kitId: Schema.NonEmptyString,
});

export const KitResultSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	nodes: Schema.Array(Schema.Any),
	edges: Schema.Array(Schema.Any),
});

export const getKit = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;
			const rows = yield* db
				.select({
					goalMapId: goalMaps.id,
					nodes: kits.nodes,
					edges: kits.edges,
				})
				.from(kits)
				.leftJoin(goalMaps, eq(kits.goalMapId, goalMaps.id))
				.where(eq(kits.goalMapId, data.kitId))
				.limit(1);

			const row = rows[0];
			if (!row) return null;

			const nodes = Array.isArray(row.nodes) ? row.nodes : [];
			const edges = Array.isArray(row.edges) ? row.edges : [];

			const result = yield* Schema.decodeUnknown(KitResultSchema)({
				goalMapId: row.goalMapId,
				nodes,
				edges,
			});
			return result;
		}).pipe(
			Effect.tapError(logRpcError("getKit")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getKit"),
			Effect.runPromise,
		),
	);

const GenerateKitSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
	layout: Schema.optionalWith(
		Schema.Union(Schema.Literal("preset"), Schema.Literal("random")),
		{ nullable: true },
	),
});

const GetKitStatusSchema = Schema.Struct({
	goalMapId: Schema.NonEmptyString,
});

export const getKitStatus = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GetKitStatusSchema)(raw))
	.handler(({ data }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			const [kitRows, goalMapRows] = yield* Effect.all([
				db
					.select({
						id: kits.id,
						layout: kits.layout,
						nodes: kits.nodes,
						updatedAt: kits.updatedAt,
					})
					.from(kits)
					.where(eq(kits.goalMapId, data.goalMapId))
					.limit(1),
				db
					.select({ updatedAt: goalMaps.updatedAt })
					.from(goalMaps)
					.where(eq(goalMaps.id, data.goalMapId))
					.limit(1),
			]);

			const kit = kitRows[0];
			const goalMap = goalMapRows[0];

			const kitNodes = kit && Array.isArray(kit.nodes) ? kit.nodes : [];
			const nodeCount = kitNodes.length;
			const kitUpdatedAt = kit?.updatedAt?.getTime() ?? null;
			const goalMapUpdatedAt = goalMap?.updatedAt?.getTime() ?? null;

			return {
				exists: !!kit,
				layout: kit?.layout ?? "preset",
				nodeCount,
				updatedAt: kitUpdatedAt,
				isOutdated:
					kitUpdatedAt && goalMapUpdatedAt
						? kitUpdatedAt < goalMapUpdatedAt
						: true,
			};
		}).pipe(
			Effect.tapError(logRpcError("getKitStatus")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("getKitStatus"),
			Effect.runPromise,
		),
	);

export const generateKit = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(GenerateKitSchema)(raw))
	.handler(({ data, context }) =>
		Effect.gen(function* () {
			const db = yield* Database;

			// Verify user is a teacher
			yield* requireTeacher(context.user.id);

			const gmRows = yield* db
				.select()
				.from(goalMaps)
				.where(eq(goalMaps.id, data.goalMapId))
				.limit(1);

			const gm = gmRows[0];
			if (!gm) {
				return yield* Effect.fail(
					new GoalMapNotFoundError({ goalMapId: data.goalMapId }),
				);
			}

			const nodes = Array.isArray(gm.nodes) ? gm.nodes : [];

			// Kit includes ALL nodes from goal map: concepts AND connectors
			// Students will only draw edges, not create new nodes
			const kitNodes = (nodes as any[]).filter(
				(n) => n?.type === "text" || n?.type === "connector",
			);

			// Kit has NO edges - students will create these by connecting nodes
			const kitEdges: any[] = [];

			const payload = {
				id: data.goalMapId,
				kitId: data.goalMapId,
				name: gm.title,
				goalMapId: data.goalMapId,
				teacherId: gm.teacherId ?? "",
				layout: data.layout ?? "preset",
				nodes: JSON.stringify(kitNodes),
				edges: JSON.stringify(kitEdges),
				textId: gm.textId,
			};

			const existingRows = yield* db
				.select({ id: kits.id })
				.from(kits)
				.where(eq(kits.goalMapId, data.goalMapId))
				.limit(1);

			const existing = existingRows[0];
			if (existing) {
				yield* db
					.update(kits)
					.set({
						name: payload.name,
						teacherId: payload.teacherId,
						layout: payload.layout,
						nodes: payload.nodes,
						edges: payload.edges,
						textId: payload.textId,
					})
					.where(eq(kits.goalMapId, data.goalMapId));
			} else {
				yield* db.insert(kits).values(payload);
			}
			return { ok: true, kitId: data.goalMapId } as const;
		}).pipe(
			Effect.tapError(logRpcError("generateKit")),
			Effect.catchTags({
				GoalMapNotFoundError: () =>
					Effect.succeed({ ok: false, error: "Goal map not found" } as const),
				ForbiddenError: (e) =>
					Effect.succeed({ ok: false, error: e.message } as const),
			}),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("generateKit"),
			Effect.runPromise,
		),
	);

export const KitRpc = {
	studentKits: () => ["student-kits"],
	listStudentKits: () =>
		queryOptions({
			queryKey: [...KitRpc.studentKits()],
			queryFn: () => listStudentKits(),
		}),
	getKit: () =>
		queryOptions({
			queryKey: [...KitRpc.studentKits(), "current"],
			queryFn: () => getKit(),
		}),
	getKitStatus: (goalMapId: string) =>
		queryOptions({
			queryKey: [...KitRpc.studentKits(), goalMapId, "status"],
			queryFn: () => getKitStatus({ data: { goalMapId } }),
		}),
	generateKit: () =>
		mutationOptions({
			mutationKey: [...KitRpc.studentKits()],
			mutationFn: (data: typeof GenerateKitSchema.Type) =>
				generateKit({ data }),
		}),
};
