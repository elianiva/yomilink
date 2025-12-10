import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { createDb } from "@/server/db/client";
import { env } from "@/env";
import { goalMaps } from "@/server/db/schema";

const GetGoalMapSchema = z.object({ goalMapId: z.string().min(1) });
export const getGoalMap = createServerFn({ method: "POST" })
	.inputValidator(GetGoalMapSchema)
	.handler(async ({ data }) => {
		const { goalMapId } = data;
		const db = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
		const row = await db
			.select()
			.from(goalMaps)
			.where(eq(goalMaps.goalMapId, goalMapId))
			.get();
		if (!row) return null;
		return {
			goalMapId: row.goalMapId,
			title: row.title,
			description: row.description,
			nodes: safeParseJson(row.nodes) ?? [],
			edges: safeParseJson(row.edges) ?? [],
			updatedAt: row.updatedAt,
			teacherId: row.teacherId,
		};
	});

const SaveGoalMapSchema = z.object({
	goalMapId: z.string().min(1),
	title: z.string().min(1),
	description: z.string().optional().nullable(),
	nodes: z.any(),
	edges: z.any(),
	updatedAt: z.number().optional(),
	teacherId: z.string().optional(),
});
export const saveGoalMap = createServerFn({ method: "POST" })
	.inputValidator(SaveGoalMapSchema)
	.handler(async ({ data }) => {
		const db = createDb(env.TURSO_DATABASE_URL, env.TURSO_AUTH_TOKEN);
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
		const existing = await db
			.select({ id: goalMaps.id })
			.from(goalMaps)
			.where(eq(goalMaps.goalMapId, data.goalMapId))
			.get();
		if (existing) {
			await db
				.update(goalMaps)
				.set(payload)
				.where(eq(goalMaps.goalMapId, data.goalMapId))
				.run();
		} else {
			await db.insert(goalMaps).values(payload).run();
		}
		return { ok: true } as const;
	});

function safeParseJson(s?: string | null) {
	try {
		return s ? JSON.parse(s) : null;
	} catch {
		return null;
	}
}
