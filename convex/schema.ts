import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	goal_maps: defineTable({
		goalMapId: v.string(),
		teacherId: v.string(),
		title: v.string(),
		description: v.optional(v.string()),
		nodes: v.any(), // ReactFlow nodes JSON
		edges: v.any(), // ReactFlow edges JSON
		updatedAt: v.number(), // epoch ms
	})
		.index("by_goalMapId", ["goalMapId"])
		.index("by_teacher", ["teacherId"]),
});
