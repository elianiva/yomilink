import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { getAuthSubject } from "./auth";
import { requireRoleFrom } from "./rbac";

type NodeType = "text" | "image" | "connector";
export type NodeJson = {
	id: string;
	type: NodeType;
	data?: { label?: string; caption?: string; url?: string };
};
export type EdgeJson = { id?: string; source: string; target: string };

function validateGoalMap(nodes: NodeJson[], edges: EdgeJson[]): string[] {
	const errs: string[] = [];
	const ids = new Set<string>(nodes.map((n) => n.id).filter(Boolean));

	// Edge endpoints must exist
	for (const e of edges) {
		if (!ids.has(e.source) || !ids.has(e.target)) {
			errs.push(
				`Edge ${e.id ?? `${e.source}-${e.target}`} references missing nodes`,
			);
		}
	}

	// Connector in/out degree checks
	const inCount: Record<string, number> = {};
	const outCount: Record<string, number> = {};
	for (const e of edges) {
		outCount[e.source] = (outCount[e.source] ?? 0) + 1;
		inCount[e.target] = (inCount[e.target] ?? 0) + 1;
	}
	for (const n of nodes) {
		if (n.type === "connector") {
			if (!inCount[n.id]) errs.push(`Connector ${n.id} has no inbound edge`);
			if (!outCount[n.id]) errs.push(`Connector ${n.id} has no outbound edge`);
		}
	}

	// Minimum requirements
	const conceptCount = nodes.filter(
		(n) => n.type === "text" || n.type === "image",
	).length;
	const connectorCount = nodes.filter((n) => n.type === "connector").length;
	if (conceptCount < 2)
		errs.push("At least 2 concept nodes (text/image) required");
	if (connectorCount < 1) errs.push("At least 1 connector node required");
	if (edges.length < 2) errs.push("At least 2 edges required");

	return errs;
}

/**
 * Build Student Module kit payload from stored goal map document
 * Contract:
 * {
 *   kit_id: string;
 *   nodes: [{ id, type: "text"|"connector"|"image", label?, image_url? }]
 *   edges: [{ source, target }]
 *   goal_map_id: string;
 * }
 */
type KitNode = {
	id: string;
	type: "text" | "image" | "connector";
	label?: string;
	image_url?: string;
};
type KitEdge = { source: string; target: string };
type KitPayload = {
	kit_id: string;
	nodes: KitNode[];
	edges: KitEdge[];
	goal_map_id: string;
};

function toKit(doc: Doc<"goal_maps">): KitPayload {
	const nodeJson: NodeJson[] = doc.nodes as unknown as NodeJson[];
	const edgeJson: EdgeJson[] = doc.edges as unknown as EdgeJson[];

	const nodes: KitNode[] = nodeJson.map((n) => {
		if (n.type === "text") {
			return { id: n.id, type: "text", label: n.data?.label ?? "" };
		}
		if (n.type === "image") {
			return {
				id: n.id,
				type: "image",
				label: n.data?.caption,
				image_url: n.data?.url,
			};
		}
		return { id: n.id, type: "connector", label: n.data?.label ?? "" };
	});

	const edges: KitEdge[] = edgeJson.map((e) => ({
		source: e.source,
		target: e.target,
	}));

	return {
		kit_id: crypto.randomUUID(),
		nodes,
		edges,
		goal_map_id: doc.goalMapId,
	};
}

/**
 * Save (upsert) a teacher goal map
 */
export const save = mutation({
	args: {
		goalMapId: v.string(),
		title: v.string(),
		description: v.optional(v.string()),
		nodes: v.any(),
		edges: v.any(),
		updatedAt: v.number(),
	},
	handler: async (ctx, args) => {
		const { userId } = await requireRoleFrom(["teacher", "admin"], () =>
			ctx.runQuery(internal.authzInternal.currentPrincipal, {}),
		);

		const errors = validateGoalMap(
			args.nodes as NodeJson[],
			args.edges as EdgeJson[],
		);
		// Guard: we still allow save but return errors to the client for UX surfacing
		const existing = await ctx.db
			.query("goal_maps")
			.withIndex("by_goalMapId", (q) => q.eq("goalMapId", args.goalMapId))
			.first();

		const toStore = {
			goalMapId: args.goalMapId,
			teacherId: userId,
			title: args.title,
			description: args.description,
			nodes: args.nodes,
			edges: args.edges,
			updatedAt: args.updatedAt,
		};

		let id: Id<"goal_maps">;
		if (existing?._id) {
			// Optional: ownership check
			if (existing.teacherId && existing.teacherId !== userId) {
				throw new Error("forbidden");
			}
			await ctx.db.patch(existing._id, toStore);
			id = existing._id;
		} else {
			id = await ctx.db.insert("goal_maps", toStore);
		}

		return {
			ok: errors.length === 0,
			id,
			errors,
		};
	},
});

/**
 * Get a goal map by goalMapId
 */
export const get = query({
	args: { goalMapId: v.string() },
	handler: async (ctx, args) => {
		await requireRoleFrom(["teacher", "admin"], () =>
			ctx.runQuery(internal.authzInternal.currentPrincipal, {}),
		);
		const doc = await ctx.db
			.query("goal_maps")
			.withIndex("by_goalMapId", (q) => q.eq("goalMapId", args.goalMapId))
			.first();
		return doc ?? null;
	},
});

/** Authenticated kit fetch for Student Module (no public HTTP). */
export const getKit = query({
	args: { goalMapId: v.string() },
	handler: async (ctx, args) => {
		await requireRoleFrom(["teacher", "admin"], () =>
			ctx.runQuery(internal.authzInternal.currentPrincipal, {}),
		);
		const doc = await ctx.db
			.query("goal_maps")
			.withIndex("by_goalMapId", (q) => q.eq("goalMapId", args.goalMapId))
			.first();
		if (!doc) return null;
		return toKit(doc);
	},
});

/**
 * Student-accessible fetch of the raw teacher graph.
 * Returns the stored ReactFlow nodes/edges so the student workspace
 * can render concept (text/image) nodes directly.
 */
export const getForStudent = query({
	args: { goalMapId: v.string() },
	handler: async (ctx, args) => {
		// Any authenticated role including students can read
		await requireRoleFrom(["student", "teacher", "admin"], () =>
			ctx.runQuery(internal.authzInternal.currentPrincipal, {}),
		);
		const doc = await ctx.db
			.query("goal_maps")
			.withIndex("by_goalMapId", (q) => q.eq("goalMapId", args.goalMapId))
			.first();
		if (!doc) return null;
		return {
			goalMapId: doc.goalMapId,
			title: doc.title,
			description: doc.description,
			nodes: doc.nodes,
			edges: doc.edges,
			updatedAt: doc.updatedAt,
		};
	},
});

/**
 * List kits (goal maps) for student selection.
 * Returns a lightweight list of available goal maps.
 */
export const listForStudent = query({
	args: {},
	handler: async (ctx) => {
		// Allow public dashboard shell: return empty list when unauthenticated
		const subject = await getAuthSubject(ctx);
		if (!subject) {
			return [];
		}
		// Authenticated roles may read the list
		await requireRoleFrom(["student", "teacher", "admin"], () =>
			ctx.runQuery(internal.authzInternal.currentPrincipal, {}),
		);
		const docs = await ctx.db.query("goal_maps").collect();
		docs.sort((a, b) => b.updatedAt - a.updatedAt);
		return docs.map((d) => ({
			goalMapId: d.goalMapId,
			title: d.title,
			description: d.description,
			updatedAt: d.updatedAt,
			teacherId: d.teacherId,
		}));
	},
});
