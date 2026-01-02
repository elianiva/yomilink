import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { Effect, Layer, Logger, Schema } from "effect";

// Use Bun's built-in YAML parser
// @ts-expect-error - Bun global is available at runtime
const YAML: { parse: (input: string) => unknown } = globalThis.Bun.YAML;
import { Auth } from "@/lib/auth";
import { randomString } from "@/lib/utils";
import { Database, DatabaseLive } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	diagnoses,
	goalMaps,
	kits,
	learnerMaps,
	texts,
	topics,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";

const SeedUserSchema = Schema.Struct({
	email: Schema.NonEmptyString,
	password: Schema.NonEmptyString,
	name: Schema.optionalWith(Schema.NonEmptyString, { nullable: true }),
	roles: Schema.optionalWith(
		Schema.Array(
			Schema.Union(
				Schema.Literal("admin"),
				Schema.Literal("teacher"),
				Schema.Literal("student"),
			),
		),
		{ nullable: true },
	),
});

type SeedUser = Schema.Schema.Type<typeof SeedUserSchema>;

const DEFAULT_USERS: readonly SeedUser[] = [
	{
		email: "admin@yomilink.local",
		password: "admin123",
		name: "Admin",
		roles: ["admin"],
	},
	{
		email: "teacher@yomilink.local",
		password: "teacher123",
		name: "Teacher One",
		roles: ["teacher"],
	},
	{
		email: "student@yomilink.local",
		password: "student123",
		name: "Student One",
		roles: ["student"],
	},
	// Demo students for the assignment demo
	{
		email: "tanaka@demo.local",
		password: "demo12345",
		name: "Tanaka Yuki",
		roles: ["student"],
	},
	{
		email: "suzuki@demo.local",
		password: "demo12345",
		name: "Suzuki Hana",
		roles: ["student"],
	},
	{
		email: "yamamoto@demo.local",
		password: "demo12345",
		name: "Yamamoto Kenji",
		roles: ["student"],
	},
	{
		email: "watanabe@demo.local",
		password: "demo12345",
		name: "Watanabe Mei",
		roles: ["student"],
	},
	{
		email: "takahashi@demo.local",
		password: "demo12345",
		name: "Takahashi Ryo",
		roles: ["student"],
	},
	{
		email: "ito@demo.local",
		password: "demo12345",
		name: "Ito Sakura",
		roles: ["student"],
	},
	{
		email: "nakamura@demo.local",
		password: "demo12345",
		name: "Nakamura Sota",
		roles: ["student"],
	},
	{
		email: "kobayashi@demo.local",
		password: "demo12345",
		name: "Kobayashi Rin",
		roles: ["student"],
	},
	{
		email: "kato@demo.local",
		password: "demo12345",
		name: "Kato Haruto",
		roles: ["student"],
	},
	{
		email: "matsumoto@demo.local",
		password: "demo12345",
		name: "Matsumoto Yui",
		roles: ["student"],
	},
];

// Demo student emails for cohort creation
const DEMO_STUDENT_EMAILS = [
	"tanaka@demo.local",
	"suzuki@demo.local",
	"yamamoto@demo.local",
	"watanabe@demo.local",
	"takahashi@demo.local",
	"ito@demo.local",
	"nakamura@demo.local",
	"kobayashi@demo.local",
	"kato@demo.local",
	"matsumoto@demo.local",
];

interface MaterialData {
	title: string;
	description: string;
	nodes: Array<{
		id: string;
		type: "text" | "connector";
		position: { x: number; y: number };
		data: { label: string; color?: string };
	}>;
	edges: Array<{
		id: string;
		source: string;
		target: string;
	}>;
	content: string;
}

interface ParsedMaterial {
	frontmatter: Partial<MaterialData>;
	content: string;
}

function parseFrontmatter(content: string): ParsedMaterial {
	const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {}, content };
	}

	const [, rawFrontmatter, markdownContent] = match;

	// Use Bun's built-in YAML parser for proper YAML parsing
	const frontmatter = YAML.parse(rawFrontmatter) as Partial<MaterialData>;

	return { frontmatter, content: markdownContent || content };
}

function loadMaterials(): MaterialData[] {
	const materialsDir = new URL(".", import.meta.url).pathname;
	const files = readdirSync(materialsDir)
		.filter((f) => f.startsWith("material-") && f.endsWith(".md"))
		.sort();

	return files.map((file) => {
		const filePath = join(materialsDir, file);
		const content = readFileSync(filePath, "utf-8");
		const { frontmatter, content: markdownContent } = parseFrontmatter(content);

		return {
			title: frontmatter.title || "",
			description: frontmatter.description || "",
			nodes: frontmatter.nodes || [],
			edges: frontmatter.edges || [],
			content: markdownContent,
		};
	});
}

const MATERIALS: MaterialData[] = loadMaterials();

const TOPICS = [
	{
		title: "Basic Greetings & Introductions",
		description:
			"Essential Japanese greetings, self-introductions, and basic polite expressions",
		goalMapTitles: ["Basic Greetings", "Self Introduction"],
	},
	{
		title: "Daily Life & Culture",
		description: "Learn about daily routines and seasonal traditions in Japan",
		goalMapTitles: ["Japanese Daily Life", "Japanese Seasons"],
	},
	{
		title: "Basic Grammar Patterns",
		description:
			"Fundamental Japanese grammar structures and sentence patterns",
		goalMapTitles: ["Desu/Masu Forms", "Particles Wa and Ga"],
	},
];

const GOAL_MAP_TO_MATERIAL: Record<string, MaterialData> = {};
for (const material of MATERIALS) {
	GOAL_MAP_TO_MATERIAL[material.title] = material;
}

// Japanese Daily Life goal map has 15 edges (e1-e15)
// Full edges list for reference:
// e1: daily-life -> morning
// e2: daily-life -> afternoon
// e3: daily-life -> evening
// e4: morning -> wake-up
// e5: morning -> breakfast
// e6: afternoon -> work
// e7: afternoon -> lunch
// e8: evening -> dinner
// e9: evening -> sleep
// e10: wake-up -> commute
// e11: breakfast -> commute
// e12: commute -> work
// e13: work -> free-time
// e14: dinner -> free-time
// e15: free-time -> sleep

// Learner map configurations for demo
// Each config specifies which edges to include (correct edges)
// Missing edges = goal edges not in learner edges
// Excessive edges = learner edges not in goal edges
interface LearnerMapConfig {
	studentEmail: string;
	attempt: number;
	// Edge IDs to include (correct edges)
	correctEdgeIds: string[];
	// Excessive edges (wrong connections)
	excessiveEdges: Array<{ source: string; target: string }>;
	expectedScore: number; // For verification
}

const LEARNER_MAP_CONFIGS: LearnerMapConfig[] = [
	// 1. Tanaka Yuki - Perfect score (100%)
	{
		studentEmail: "tanaka@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			"e12",
			"e13",
			"e14",
			"e15",
		],
		excessiveEdges: [],
		expectedScore: 1.0, // 15/15 = 100%
	},
	// 2. Suzuki Hana - Near perfect (93%, 14/15)
	{
		studentEmail: "suzuki@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			"e12",
			"e13",
			"e14",
			// Missing e15 (free-time -> sleep)
		],
		excessiveEdges: [],
		expectedScore: 0.93, // 14/15
	},
	// 3. Yamamoto Kenji - Good (80%, 12/15)
	{
		studentEmail: "yamamoto@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			"e12",
			// Missing e13, e14, e15
		],
		excessiveEdges: [],
		expectedScore: 0.8, // 12/15
	},
	// 4. Watanabe Mei - Good with some extras (73%, 11/15)
	{
		studentEmail: "watanabe@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			// Missing e12, e13, e14, e15
		],
		excessiveEdges: [
			{ source: "daily-life", target: "commute" }, // Wrong direct connection
		],
		expectedScore: 0.73, // 11/15
	},
	// 5. Takahashi Ryo - First attempt (60%, 9/15)
	{
		studentEmail: "takahashi@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			// Missing e10-e15
		],
		excessiveEdges: [
			{ source: "morning", target: "sleep" }, // Wrong connection
		],
		expectedScore: 0.6, // 9/15
	},
	// 6. Takahashi Ryo - Second attempt improved (87%, 13/15)
	{
		studentEmail: "takahashi@demo.local",
		attempt: 2,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			"e12",
			"e13",
			// Missing e14, e15
		],
		excessiveEdges: [],
		expectedScore: 0.87, // 13/15
	},
	// 7. Ito Sakura - Average (67%, 10/15)
	{
		studentEmail: "ito@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			// Missing e11-e15
		],
		excessiveEdges: [],
		expectedScore: 0.67, // 10/15
	},
	// 8. Nakamura Sota - Below average (53%, 8/15)
	{
		studentEmail: "nakamura@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			// Missing e9-e15
		],
		excessiveEdges: [
			{ source: "work", target: "sleep" }, // Skipped free-time
		],
		expectedScore: 0.53, // 8/15
	},
	// 9. Kobayashi Rin - Struggling (40%, 6/15)
	{
		studentEmail: "kobayashi@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			// Missing e7-e15
		],
		excessiveEdges: [
			{ source: "daily-life", target: "sleep" }, // Wrong direct connection
			{ source: "morning", target: "free-time" }, // Wrong connection
		],
		expectedScore: 0.4, // 6/15
	},
	// 10. Kato Haruto - Good (73%, 11/15)
	{
		studentEmail: "kato@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			// Missing e12-e15
		],
		excessiveEdges: [],
		expectedScore: 0.73, // 11/15
	},
	// 11. Matsumoto Yui - Good (80%, 12/15)
	{
		studentEmail: "matsumoto@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e13",
			"e14",
			"e15",
			// Missing e10, e11, e12
		],
		excessiveEdges: [],
		expectedScore: 0.8, // 12/15
	},
];

const program = Effect.gen(function* () {
	const authService = yield* Auth;
	const db = yield* Database;

	yield* Effect.log("Seeding database...");

	// Track user IDs by email for later use
	const userIdsByEmail: Record<string, string> = {};
	let teacherId = "";

	// Seed users first
	yield* Effect.log(`Seeding ${DEFAULT_USERS.length} users...`);

	const userResults = yield* Effect.all(
		DEFAULT_USERS.map((seedUser) =>
			Effect.gen(function* () {
				// Try to find existing user first
				const existingUser = yield* db
					.select()
					.from(user)
					.where(eq(user.email, seedUser.email))
					.limit(1);

				let userId = "";
				if (existingUser[0]) {
					userId = existingUser[0].id;
					yield* Effect.log(`User ${seedUser.email} already exists`);
				} else {
					// Create new user
					const result = yield* Effect.tryPromise(() =>
						authService.api.signUpEmail({
							body: {
								email: seedUser.email,
								password: seedUser.password,
								name: seedUser.name as string,
							},
						}),
					);

					if (result.user) {
						userId = result.user.id;
						yield* Effect.log(`Created user: ${seedUser.email}`);
					}
				}

				// Set user's role
				if (userId && seedUser.roles?.[0]) {
					yield* db
						.update(user)
						.set({ role: seedUser.roles?.[0] })
						.where(eq(user.id, userId));
					yield* Effect.log(
						`Set role '${seedUser.roles?.[0]}' for ${seedUser.email}`,
					);
				}

				// Return result for tracking
				return {
					email: seedUser.email,
					userId,
					roles: seedUser.roles,
				};
			}),
		),
		{ concurrency: 10 },
	);

	// Build lookup objects from results
	for (const result of userResults) {
		userIdsByEmail[result.email] = result.userId;
		if (result.roles?.includes("teacher")) {
			teacherId = result.userId;
		}
	}

	// Seed topics and goal maps from materials
	yield* Effect.log(
		`Seeding ${TOPICS.length} topics with ${MATERIALS.length} goal maps...`,
	);

	// Track goal map IDs by title for later use
	const goalMapIdsByTitle: Record<string, string> = {};
	const goalMapDataByTitle: Record<
		string,
		{ nodes: MaterialData["nodes"]; edges: MaterialData["edges"] }
	> = {};

	// Create topics in parallel
	const topicResults = yield* Effect.all(
		TOPICS.map((topicData) =>
			Effect.gen(function* () {
				// Check if topic exists by title
				const existingTopic = yield* db
					.select()
					.from(topics)
					.where(eq(topics.title, topicData.title))
					.limit(1);

				let topicId: string;
				if (existingTopic[0]) {
					topicId = existingTopic[0].id;
					yield* db
						.update(topics)
						.set({ description: topicData.description })
						.where(eq(topics.id, topicId));
					yield* Effect.log(`Updated topic: ${topicData.title}`);
				} else {
					topicId = randomString();
					yield* db.insert(topics).values({
						id: topicId,
						title: topicData.title,
						description: topicData.description,
					});
					yield* Effect.log(`Created topic: ${topicData.title}`);
				}

				// Insert goal maps for this topic from materials (in parallel)
				const goalMapResults = yield* Effect.all(
					topicData.goalMapTitles.map((mapTitle) =>
						Effect.gen(function* () {
							const material = GOAL_MAP_TO_MATERIAL[mapTitle];

							if (!material) {
								yield* Effect.log(`No material found for: ${mapTitle}`);
								return null;
							}

							// Check if text exists by title
							const existingText = yield* db
								.select()
								.from(texts)
								.where(eq(texts.title, material.title))
								.limit(1);

							let textId: string;
							if (existingText[0]) {
								textId = existingText[0].id;
								yield* db
									.update(texts)
									.set({ content: material.content })
									.where(eq(texts.id, textId));
							} else {
								textId = randomString();
								yield* db.insert(texts).values({
									id: textId,
									title: material.title,
									content: material.content,
								});
							}

							// Check if goal map exists by title
							const existingGoalMap = yield* db
								.select()
								.from(goalMaps)
								.where(eq(goalMaps.title, material.title))
								.limit(1);

							let goalMapId: string;
							if (existingGoalMap[0]) {
								goalMapId = existingGoalMap[0].id;
								yield* db
									.update(goalMaps)
									.set({
										description: material.description,
										nodes: material.nodes,
										edges: material.edges,
									})
									.where(eq(goalMaps.id, goalMapId));
								yield* Effect.log(`  Updated goal map: ${material.title}`);
							} else {
								goalMapId = randomString();
								yield* db.insert(goalMaps).values({
									id: goalMapId,
									teacherId: teacherId,
									title: material.title,
									description: material.description,
									nodes: material.nodes,
									edges: material.edges,
									topicId: topicId,
									textId: textId,
								});
								yield* Effect.log(`  Created goal map: ${material.title}`);
							}

							// Return tracking data
							return {
								title: material.title,
								goalMapId,
								material,
							};
						}),
					),
					{ concurrency: 10 },
				);

				return {
					topicId,
					goalMapResults,
				};
			}),
		),
		{ concurrency: 10 },
	);

	// Build lookup objects from results
	for (const topicResult of topicResults) {
		for (const result of topicResult.goalMapResults) {
			if (result) {
				goalMapIdsByTitle[result.title] = result.goalMapId;
				goalMapDataByTitle[result.title] = {
					nodes: result.material.nodes,
					edges: result.material.edges,
				};
			}
		}
	}

	// ============================================
	// DEMO DATA: Cohort, Kit, Assignment, Learner Maps, Diagnoses
	// ============================================

	yield* Effect.log("--- Creating Demo Data ---");

	// 1. Create Demo Cohort
	yield* Effect.log("Creating demo cohort...");
	const demoCohortName = "Demo Class 2025";

	const existingCohort = yield* db
		.select()
		.from(cohorts)
		.where(eq(cohorts.name, demoCohortName))
		.limit(1);

	let demoCohortId: string;
	if (existingCohort[0]) {
		demoCohortId = existingCohort[0].id;
		yield* Effect.log(`  Cohort "${demoCohortName}" already exists`);
	} else {
		demoCohortId = randomString();
		yield* db.insert(cohorts).values({
			id: demoCohortId,
			name: demoCohortName,
			description: "Demo class for professor presentation",
		});
		yield* Effect.log(`  Created cohort: ${demoCohortName}`);
	}

	// 2. Add demo students to cohort
	yield* Effect.log("Adding demo students to cohort...");

	// Fetch existing members once
	const existingMembers = yield* db
		.select()
		.from(cohortMembers)
		.where(eq(cohortMembers.cohortId, demoCohortId));

	const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

	// Add missing students in parallel
	yield* Effect.all(
		DEMO_STUDENT_EMAILS.map((studentEmail) =>
			Effect.gen(function* () {
				const studentId = userIdsByEmail[studentEmail];
				if (!studentId) {
					yield* Effect.log(`  Student ${studentEmail} not found, skipping...`);
					return;
				}

				if (existingMemberIds.has(studentId)) {
					yield* Effect.log(`  ${studentEmail} already in cohort`);
					return;
				}

				yield* db.insert(cohortMembers).values({
					id: randomString(),
					cohortId: demoCohortId,
					userId: studentId,
					role: "member",
				});
				yield* Effect.log(`  Added ${studentEmail} to cohort`);
			}),
		),
		{ concurrency: 10 },
	);

	// 3. Create Kit for Japanese Daily Life goal map
	yield* Effect.log("Creating kit for Japanese Daily Life...");
	const dailyLifeGoalMapId = goalMapIdsByTitle["Japanese Daily Life"];
	const dailyLifeData = goalMapDataByTitle["Japanese Daily Life"];

	if (!dailyLifeGoalMapId || !dailyLifeData) {
		yield* Effect.log("Japanese Daily Life goal map not found!");
		return;
	}

	// Get textId for the goal map
	const dailyLifeGoalMap = yield* db
		.select()
		.from(goalMaps)
		.where(eq(goalMaps.id, dailyLifeGoalMapId))
		.limit(1);

	const dailyLifeTextId = dailyLifeGoalMap[0]?.textId || null;

	const kitName = "Japanese Daily Life Kit";
	const existingKit = yield* db
		.select()
		.from(kits)
		.where(eq(kits.name, kitName))
		.limit(1);

	let demoKitId: string;
	if (existingKit[0]) {
		demoKitId = existingKit[0].id;
		yield* Effect.log(`  Kit "${kitName}" already exists`);
	} else {
		demoKitId = randomString();
		const kitKitId = randomString(); // The unique kit identifier

		yield* db.insert(kits).values({
			id: demoKitId,
			kitId: kitKitId,
			name: kitName,
			layout: "preset",
			enabled: true,
			goalMapId: dailyLifeGoalMapId,
			teacherId: teacherId,
			textId: dailyLifeTextId,
			// Nodes from goal map (for students to arrange)
			nodes: JSON.stringify(dailyLifeData.nodes),
			// Empty edges (students need to create these)
			edges: "[]",
		});
		yield* Effect.log(`  Created kit: ${kitName}`);
	}

	// 4. Create Assignment
	yield* Effect.log("Creating assignment...");
	const assignmentTitle = "Japanese Daily Life Quiz";

	const existingAssignment = yield* db
		.select()
		.from(assignments)
		.where(eq(assignments.title, assignmentTitle))
		.limit(1);

	let demoAssignmentId: string;
	// Dates: started 2 weeks ago, due 1 week ago (already completed)
	const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
	const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

	if (existingAssignment[0]) {
		demoAssignmentId = existingAssignment[0].id;
		yield* Effect.log(`  Assignment "${assignmentTitle}" already exists`);
	} else {
		demoAssignmentId = randomString();

		yield* db.insert(assignments).values({
			id: demoAssignmentId,
			goalMapId: dailyLifeGoalMapId,
			kitId: demoKitId,
			title: assignmentTitle,
			description:
				"Learn about daily routines in Japan by creating a concept map.",
			timeLimitMinutes: 30,
			startDate: twoWeeksAgo,
			dueAt: oneWeekAgo,
			createdBy: teacherId,
		});
		yield* Effect.log(`  Created assignment: ${assignmentTitle}`);
	}

	// 5. Create Assignment Target (link to cohort)
	yield* Effect.log("Linking assignment to cohort...");
	const existingTarget = yield* db
		.select()
		.from(assignmentTargets)
		.where(eq(assignmentTargets.assignmentId, demoAssignmentId))
		.limit(1);

	if (existingTarget[0]) {
		yield* Effect.log("  Assignment already linked to cohort");
	} else {
		yield* db.insert(assignmentTargets).values({
			id: randomString(),
			assignmentId: demoAssignmentId,
			cohortId: demoCohortId,
			userId: null,
		});
		yield* Effect.log("  Linked assignment to cohort");
	}

	// 6. Create Learner Maps and Diagnoses
	yield* Effect.log("Creating learner maps and diagnoses...");

	// Build edge lookup from goal map
	const goalEdges = dailyLifeData.edges;
	const edgeById: Record<string, { source: string; target: string }> = {};
	for (const edge of goalEdges) {
		edgeById[edge.id] = { source: edge.source, target: edge.target };
	}

	// Fetch existing learner maps once
	const existingLearnerMaps = yield* db
		.select()
		.from(learnerMaps)
		.where(eq(learnerMaps.assignmentId, demoAssignmentId));

	const existingMapKeySet = new Set(
		existingLearnerMaps.map((lm) => `${lm.userId}:${lm.attempt}`),
	);

	// Submission date (1 week ago, a few hours before due date)
	const submissionDate = new Date(oneWeekAgo.getTime() - 3 * 60 * 60 * 1000);

	// Create learner maps and diagnoses in parallel
	yield* Effect.all(
		LEARNER_MAP_CONFIGS.map((config) =>
			Effect.gen(function* () {
				const studentId = userIdsByEmail[config.studentEmail];
				if (!studentId) {
					yield* Effect.log(
						`  Student ${config.studentEmail} not found, skipping...`,
					);
					return;
				}

				const mapKey = `${studentId}:${config.attempt}`;
				if (existingMapKeySet.has(mapKey)) {
					yield* Effect.log(
						`  Learner map for ${config.studentEmail} attempt ${config.attempt} already exists`,
					);
					return;
				}

				// Build learner edges from config
				const learnerEdges: Array<{
					id: string;
					source: string;
					target: string;
				}> = [];

				// Add correct edges
				for (const edgeId of config.correctEdgeIds) {
					const edge = edgeById[edgeId];
					if (edge) {
						learnerEdges.push({
							id: edgeId,
							source: edge.source,
							target: edge.target,
						});
					}
				}

				// Add excessive edges (wrong connections)
				for (let i = 0; i < config.excessiveEdges.length; i++) {
					const excessive = config.excessiveEdges[i];
					learnerEdges.push({
						id: `excess-${i + 1}`,
						source: excessive.source,
						target: excessive.target,
					});
				}

				// Create learner map
				const learnerMapId = randomString();
				yield* db.insert(learnerMaps).values({
					id: learnerMapId,
					assignmentId: demoAssignmentId,
					goalMapId: dailyLifeGoalMapId,
					kitId: demoKitId,
					userId: studentId,
					nodes: JSON.stringify(dailyLifeData.nodes),
					edges: JSON.stringify(learnerEdges),
					status: "submitted",
					attempt: config.attempt,
					submittedAt: submissionDate,
				});
				yield* Effect.log(
					`  Created learner map for ${config.studentEmail} (attempt ${config.attempt})`,
				);

				// Calculate actual score
				const correctCount = config.correctEdgeIds.length;
				const totalGoalEdges = 15; // Japanese Daily Life has 15 edges
				const score = Math.round((correctCount / totalGoalEdges) * 100) / 100;

				// Build per-link diagnosis data
				const perLink = {
					correct: config.correctEdgeIds.map((edgeId) => {
						const edge = edgeById[edgeId];
						return {
							source: edge?.source,
							target: edge?.target,
							edgeId,
						};
					}),
					missing: goalEdges
						.filter((e) => !config.correctEdgeIds.includes(e.id))
						.map((e) => ({
							source: e.source,
							target: e.target,
							edgeId: e.id,
						})),
					excessive: config.excessiveEdges.map((e, i) => ({
						source: e.source,
						target: e.target,
						edgeId: `excess-${i + 1}`,
					})),
				};

				// Create diagnosis
				yield* db.insert(diagnoses).values({
					id: randomString(),
					goalMapId: dailyLifeGoalMapId,
					learnerMapId: learnerMapId,
					summary: `Score: ${Math.round(score * 100)}% (${correctCount}/${totalGoalEdges} correct edges)`,
					perLink: perLink,
					score: score,
					rubricVersion: "v1.0",
				});
				yield* Effect.log(
					`  Created diagnosis for ${config.studentEmail}: ${Math.round(score * 100)}%`,
				);
			}),
		),
		{ concurrency: 10 },
	);

	yield* Effect.log(
		"--- Seed completed ---\n" +
			"Demo credentials:\n" +
			"  Teacher: teacher@yomilink.local / teacher123\n" +
			"  Demo students: [name]@demo.local / demo12345\n" +
			"    - tanaka, suzuki, yamamoto, watanabe, takahashi\n" +
			"    - ito, nakamura, kobayashi, kato, matsumoto\n",
	);
}).pipe(
	Effect.provide(Layer.mergeAll(DatabaseLive, Auth.Default, Logger.pretty)),
);

Effect.runPromise(program);
