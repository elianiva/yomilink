import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
	...authTables,
	// Extend users table to include convex-auth required fields + custom role
	users: defineTable({
		// tokenIdentifier is populated by @convex-dev/auth; mark optional to satisfy TS in profile()
		tokenIdentifier: v.optional(v.string()),
		// Common profile fields
		name: v.optional(v.string()),
		image: v.optional(v.string()),
		email: v.optional(v.string()),
		emailVerificationTime: v.optional(v.number()),
		phone: v.optional(v.string()),
		phoneVerificationTime: v.optional(v.number()),
		isAnonymous: v.optional(v.boolean()),
		// Custom app role (legacy fallback; canonical role lives in user_roles)
		role: v.optional(
			v.union(v.literal("admin"), v.literal("teacher"), v.literal("student")),
		),
	})
		.index("by_tokenIdentifier", ["tokenIdentifier"])
		.index("email", ["email"]),
	user_roles: defineTable({
		userId: v.id("users"),
		role: v.union(
			v.literal("admin"),
			v.literal("teacher"),
			v.literal("student"),
		),
	}).index("by_user", ["userId"]),
	goal_maps: defineTable({
		goalMapId: v.string(),
		teacherId: v.id("users"),
		title: v.string(),
		description: v.optional(v.string()),
		nodes: v.any(), // ReactFlow nodes JSON
		edges: v.any(), // ReactFlow edges JSON
		updatedAt: v.number(), // epoch ms
	})
		.index("by_goalMapId", ["goalMapId"])
		.index("by_teacher", ["teacherId"]),
});
