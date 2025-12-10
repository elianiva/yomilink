import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createDb } from "@/server/db/client";
import { env } from "@/env";
import { goalMaps, kits } from "@/server/db/schema";

export type StudentKit = {
	goalMapId: string;
	title: string;
	description: string | null;
	updatedAt: number;
	teacherId: string;
};

export const listStudentKits = createServerFn({ method: "GET" })
	.inputValidator(z.void())
	.handler(async () => {
		const db = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
		const rows = await db
			.select({
				goalMapId: goalMaps.goalMapId,
				title: goalMaps.title,
				description: goalMaps.description,
				updatedAt: goalMaps.updatedAt,
				teacherId: goalMaps.teacherId,
			})
			.from(goalMaps)
			.leftJoin(kits, eq(kits.goalMapId, goalMaps.goalMapId))
			.orderBy(desc(goalMaps.updatedAt));
		return rows as StudentKit[];
	});

const GetKitSchema = z.object({ kitId: z.string().min(1) });
export const getKit = createServerFn({ method: "POST" })
	.inputValidator(GetKitSchema)
	.handler(async ({ data }) => {
		const { kitId } = data;
		const db = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
		const row = await db
			.select({
				goalMapId: goalMaps.goalMapId,
				nodes: kits.nodes,
				edges: kits.edges,
			})
			.from(kits)
			.leftJoin(goalMaps, eq(kits.goalMapId, goalMaps.goalMapId))
			.where(eq(kits.goalMapId, kitId))
			.get();
		if (!row) return null;
		return {
			goalMapId: row.goalMapId,
			nodes: safeParseJson(row.nodes) ?? [],
			edges: safeParseJson(row.edges) ?? [],
		};
	});

const GenerateKitSchema = z.object({ goalMapId: z.string().min(1) });
export const generateKit = createServerFn({ method: "POST" })
	.inputValidator(GenerateKitSchema)
	.handler(async ({ data }) => {
		const { goalMapId } = data;
		const db = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
		const gm = await db
			.select()
			.from(goalMaps)
			.where(eq(goalMaps.goalMapId, goalMapId))
			.get();
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
			id: goalMapId,
			goalMapId,
			createdBy: gm.teacherId ?? "",
			nodes: JSON.stringify(kitNodes),
			edges: JSON.stringify(kitEdges),
			constraints: null as any,
			version: 1,
			createdAt: Date.now(),
		};
		const existing = await db
			.select({ id: kits.id })
			.from(kits)
			.where(eq(kits.goalMapId, goalMapId))
			.get();
		if (existing) {
			await db
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
				.where(eq(kits.goalMapId, goalMapId))
				.run();
		} else {
			await db
				.insert(kits)
				.values({
					id: payload.id,
					goalMapId: payload.goalMapId,
					createdBy: payload.createdBy,
					nodes: payload.nodes,
					edges: payload.edges,
					constraints: null,
					version: payload.version,
					createdAt: payload.createdAt,
				})
				.run();
		}
		return { ok: true, kitId: goalMapId } as const;
	});

function safeParseJson(s?: string | null) {
	try {
		return s ? JSON.parse(s) : null;
	} catch {
		return null;
	}
}
