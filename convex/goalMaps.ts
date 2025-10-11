import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole } from "./authz";


/**
 * Minimal server-side validation mirroring PLAN.md
 */
function validateGoalMap(nodes: any[], edges: any[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>(nodes?.map((n: any) => n?.id).filter(Boolean) ?? []);

  // Edge endpoints must exist
  for (const e of edges ?? []) {
    if (!ids.has(e?.source) || !ids.has(e?.target)) {
      errs.push(`Edge ${e?.id ?? `${e?.source}-${e?.target}`} references missing nodes`);
    }
  }

  // Connector in/out degree checks
  const inCount: Record<string, number> = {};
  const outCount: Record<string, number> = {};
  for (const e of edges ?? []) {
    if (e?.source) outCount[e.source] = (outCount[e.source] ?? 0) + 1;
    if (e?.target) inCount[e.target] = (inCount[e.target] ?? 0) + 1;
  }
  for (const n of nodes ?? []) {
    if (n?.type === "connector") {
      if (!inCount[n.id]) errs.push(`Connector ${n.id} has no inbound edge`);
      if (!outCount[n.id]) errs.push(`Connector ${n.id} has no outbound edge`);
    }
  }

  // Minimum requirements
  const conceptCount = (nodes ?? []).filter((n: any) => n?.type === "text" || n?.type === "image").length;
  const connectorCount = (nodes ?? []).filter((n: any) => n?.type === "connector").length;
  if (conceptCount < 2) errs.push("At least 2 concept nodes (text/image) required");
  if (connectorCount < 1) errs.push("At least 1 connector node required");
  if ((edges ?? []).length < 2) errs.push("At least 2 edges required");

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
function toKit(doc: any) {
  const nodes = (doc?.nodes ?? []).map((n: any) => {
    if (n?.type === "text") {
      return { id: n.id, type: "text", label: n?.data?.label ?? "" };
    }
    if (n?.type === "image") {
      return {
        id: n.id,
        type: "image",
        label: n?.data?.caption,
        image_url: n?.data?.url,
      };
    }
    return { id: n?.id, type: "connector", label: n?.data?.label ?? "" };
  });

  const edges = (doc?.edges ?? []).map((e: any) => ({
    source: e?.source,
    target: e?.target,
  }));

  return {
    kit_id: crypto.randomUUID(),
    nodes,
    edges,
    goal_map_id: doc?.goalMapId,
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
    const { userId } = await requireRole(ctx, ["teacher", "admin"]);

    const errors = validateGoalMap(args.nodes as any[], args.edges as any[]);
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

    let id: any;
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
    await requireRole(ctx, ["teacher", "admin"]);
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
    await requireRole(ctx, ["teacher", "admin"]);
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
    await requireRole(ctx, ["student", "teacher", "admin"]);
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
    await requireRole(ctx, ["student", "teacher", "admin"]);
    const docs = await ctx.db.query("goal_maps").collect();
    docs.sort((a: any, b: any) => (b?.updatedAt ?? 0) - (a?.updatedAt ?? 0));
    return docs.map((d: any) => ({
      goalMapId: d.goalMapId as string,
      title: d.title as string,
      description: (d as any).description as string | undefined,
      updatedAt: d.updatedAt as number,
      teacherId: d.teacherId as string,
    }));
  },
});
