import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { Effect, Layer, Logger, Schema } from "effect";
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
	const frontmatter: Partial<MaterialData> = {};

	// Simple key-value parser for frontmatter
	const lines = rawFrontmatter.split("\n");
	let currentKey: string | null = null;
	let currentValue: any = null;
	let inArray = false;
	let inObject = false;
	let objectDepth = 0;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Skip empty lines
		if (!trimmedLine) {
			continue;
		}

		// Check for array or object
		if (trimmedLine.startsWith("- ") || trimmedLine.match(/^- id:/)) {
			inArray = true;
		}

		if (trimmedLine.includes("{") && !trimmedLine.includes("}")) {
			inObject = true;
			objectDepth++;
		}
		if (trimmedLine.includes("}") && !trimmedLine.includes("{")) {
			objectDepth--;
			if (objectDepth === 0) {
				inObject = false;
			}
		}

		const colonIndex = trimmedLine.indexOf(":");

		if (colonIndex !== -1 && !inObject && !inArray) {
			// Save previous value if exists
			if (currentKey !== null) {
				frontmatter[currentKey as keyof MaterialData] = currentValue;
			}

			currentKey = trimmedLine.slice(0, colonIndex).trim();
			const value = trimmedLine.slice(colonIndex + 1).trim();

			if (value.startsWith('"') && value.endsWith('"')) {
				currentValue = value.slice(1, -1);
			} else {
				currentValue = value;
			}
			inArray = false;
		} else if (colonIndex !== -1 && inArray) {
			// Array item with key
			const key = trimmedLine.slice(0, colonIndex).trim();
			const value = trimmedLine.slice(colonIndex + 1).trim();

			if (!Array.isArray(currentValue)) {
				currentValue = [];
			}
			const item: Record<string, any> = {};

			if (value.startsWith('"') && value.endsWith('"')) {
				item[key] = value.slice(1, -1);
			} else if (value.startsWith("{") && value.endsWith("}")) {
				try {
					item[key] = JSON.parse(value);
				} catch {
					item[key] = value;
				}
			} else {
				item[key] = value;
			}

			currentValue.push(item);
			if (key === "id" || key === "type") {
				inArray = false;
			}
		} else if (trimmedLine.startsWith("- ") && inArray) {
			// Array item without key (continuation)
			const value = trimmedLine.slice(2).trim();
			if (typeof currentValue === "object" && currentValue !== null) {
				const lastItem = currentValue[currentValue.length - 1];
				if (lastItem) {
					if (value.startsWith("{") && value.endsWith("}")) {
						try {
							Object.assign(lastItem, JSON.parse(value));
						} catch {
							lastItem.data = value;
						}
					}
				}
			}
		} else if (inArray && trimmedLine.startsWith("id:")) {
			// Start new array item
			const id = trimmedLine.slice(3).trim();
			if (!Array.isArray(currentValue)) {
				currentValue = [];
			}
			currentValue.push({ id });
		} else if (
			inArray &&
			(trimmedLine.startsWith("type:") ||
				trimmedLine.startsWith("position:") ||
				trimmedLine.startsWith("data:") ||
				trimmedLine.startsWith("source:") ||
				trimmedLine.startsWith("target:"))
		) {
			// Add property to last array item
			if (Array.isArray(currentValue) && currentValue.length > 0) {
				const colonIdx = trimmedLine.indexOf(":");
				const key = trimmedLine.slice(0, colonIdx).trim();
				const value = trimmedLine.slice(colonIdx + 1).trim();
				const lastItem = currentValue[currentValue.length - 1];
				if (value.startsWith("{") && value.endsWith("}")) {
					try {
						lastItem[key] = JSON.parse(value);
					} catch {
						lastItem[key] = value;
					}
				} else if (value.startsWith('"') && value.endsWith('"')) {
					lastItem[key] = value.slice(1, -1);
				} else {
					lastItem[key] = value;
				}
			}
		}
	}

	// Save last value
	if (currentKey !== null) {
		frontmatter[currentKey as keyof MaterialData] = currentValue;
	}

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
		title: "Hiragana & Katakana",
		description:
			"Master the Japanese phonetic alphabets - hiragana and katakana",
		goalMapTitles: ["Hiragana Vowels", "Hiragana Basic Syllables"],
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

// Hiragana Vowels goal map has 18 edges (e1-e18)
// Full edges list for reference:
// e1: vowels -> a
// e2: vowels -> i
// e3: vowels -> u
// e4: vowels -> e
// e5: vowels -> o
// e6: a -> pronunciation
// e7: i -> pronunciation
// e8: u -> pronunciation
// e9: e -> pronunciation
// e10: o -> pronunciation
// e11: a -> writing
// e12: i -> writing
// e13: u -> writing
// e14: e -> writing
// e15: o -> writing
// e16: pronunciation -> practice
// e17: writing -> practice
// e18: practice -> memory

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
			"e16",
			"e17",
			"e18",
		],
		excessiveEdges: [],
		expectedScore: 1.0, // 18/18 = 100%
	},
	// 2. Suzuki Hana - Near perfect (94%, 17/18)
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
			"e15",
			"e16",
			"e17",
			// Missing e18 (practice -> memory)
		],
		excessiveEdges: [],
		expectedScore: 0.94, // 17/18
	},
	// 3. Yamamoto Kenji - Good (83%, 15/18)
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
			"e13",
			"e14",
			"e15",
			// Missing e16, e17, e18
		],
		excessiveEdges: [],
		expectedScore: 0.83, // 15/18
	},
	// 4. Watanabe Mei - Good with some extras (78%, 14/18)
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
			"e12",
			"e13",
			"e14",
			// Missing e15, e16, e17, e18
		],
		excessiveEdges: [
			{ source: "vowels", target: "practice" }, // Wrong direct connection
		],
		expectedScore: 0.78, // 14/18
	},
	// 5. Takahashi Ryo - First attempt (56%, 10/18)
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
			"e10",
			// Missing e11-e18
		],
		excessiveEdges: [
			{ source: "a", target: "memory" }, // Wrong connection
		],
		expectedScore: 0.56, // 10/18
	},
	// 6. Takahashi Ryo - Second attempt improved (89%, 16/18)
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
			"e14",
			"e15",
			"e16",
			// Missing e17, e18
		],
		excessiveEdges: [],
		expectedScore: 0.89, // 16/18
	},
	// 7. Ito Sakura - Average (67%, 12/18)
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
			"e11",
			"e12",
			// Missing e13-e18
		],
		excessiveEdges: [],
		expectedScore: 0.67, // 12/18
	},
	// 8. Nakamura Sota - Below average (61%, 11/18)
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
			"e9",
			"e10",
			"e11",
			// Missing e12-e18
		],
		excessiveEdges: [
			{ source: "pronunciation", target: "memory" }, // Skipped practice
		],
		expectedScore: 0.61, // 11/18
	},
	// 9. Kobayashi Rin - Struggling (39%, 7/18)
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
			"e7",
			// Missing e8-e18
		],
		excessiveEdges: [
			{ source: "vowels", target: "memory" }, // Wrong direct connection
			{ source: "a", target: "practice" }, // Wrong connection
		],
		expectedScore: 0.39, // 7/18
	},
	// 10. Kato Haruto - Good (72%, 13/18)
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
			"e12",
			"e13",
			// Missing e14-e18
		],
		excessiveEdges: [],
		expectedScore: 0.72, // 13/18
	},
	// 11. Matsumoto Yui - Good (78%, 14/18)
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
			"e10",
			"e16",
			"e17",
			"e18",
			"e11",
			// Missing e12, e13, e14, e15
		],
		excessiveEdges: [],
		expectedScore: 0.78, // 14/18
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

	// 3. Create Kit for Hiragana Vowels goal map
	yield* Effect.log("Creating kit for Hiragana Vowels...");
	const hiraganaVowelsGoalMapId = goalMapIdsByTitle["Hiragana Vowels"];
	const hiraganaVowelsData = goalMapDataByTitle["Hiragana Vowels"];

	if (!hiraganaVowelsGoalMapId || !hiraganaVowelsData) {
		yield* Effect.log("Hiragana Vowels goal map not found!");
		return;
	}

	// Get textId for the goal map
	const hiraganaVowelsGoalMap = yield* db
		.select()
		.from(goalMaps)
		.where(eq(goalMaps.id, hiraganaVowelsGoalMapId))
		.limit(1);

	const hiraganaVowelsTextId = hiraganaVowelsGoalMap[0]?.textId || null;

	const kitName = "Hiragana Vowels Kit";
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
			goalMapId: hiraganaVowelsGoalMapId,
			teacherId: teacherId,
			textId: hiraganaVowelsTextId,
			// Nodes from goal map (for students to arrange)
			nodes: JSON.stringify(hiraganaVowelsData.nodes),
			// Empty edges (students need to create these)
			edges: "[]",
		});
		yield* Effect.log(`  Created kit: ${kitName}`);
	}

	// 4. Create Assignment
	yield* Effect.log("Creating assignment...");
	const assignmentTitle = "Hiragana Vowels Quiz";

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
			goalMapId: hiraganaVowelsGoalMapId,
			kitId: demoKitId,
			title: assignmentTitle,
			description:
				"Learn the five basic hiragana vowels by creating a concept map.",
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
	const goalEdges = hiraganaVowelsData.edges;
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
					goalMapId: hiraganaVowelsGoalMapId,
					kitId: demoKitId,
					userId: studentId,
					nodes: JSON.stringify(hiraganaVowelsData.nodes),
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
				const totalGoalEdges = 18; // Hiragana Vowels has 18 edges
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
					goalMapId: hiraganaVowelsGoalMapId,
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

export const seedDatabase = Effect.fn("seedDatabase")(
	(databaseLayer: typeof DatabaseLive) =>
		Effect.gen(function* () {
			const authService = yield* Auth;
			const db = yield* databaseLayer;

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

			// Create minimal seed data for tests
			yield* Effect.log("Creating minimal test data...");

			// Create one test topic
			const testTopicId = randomString();
			yield* db.insert(topics).values({
				id: testTopicId,
				title: "Test Topic",
				description: "Test Description",
			});

			// Create one test goal map
			const testGoalMapId = randomString();
			yield* db.insert(goalMaps).values({
				id: testGoalMapId,
				teacherId: teacherId,
				title: "Test Goal Map",
				description: "Test Description",
				nodes: JSON.stringify([]),
				edges: JSON.stringify([]),
				topicId: testTopicId,
				textId: null,
			});

			// Create one test kit
			const testKitId = randomString();
			yield* db.insert(kits).values({
				id: testKitId,
				kitId: testKitId,
				name: "Test Kit",
				goalMapId: testGoalMapId,
				teacherId: teacherId,
				textId: null,
				nodes: "[]",
				edges: "[]",
				layout: "preset",
				enabled: true,
			});

			// Create one test assignment
			const testAssignmentId = randomString();
			yield* db.insert(assignments).values({
				id: testAssignmentId,
				goalMapId: testGoalMapId,
				kitId: testKitId,
				title: "Test Assignment",
				description: "Test Description",
				startDate: new Date(),
				dueAt: null,
				createdBy: teacherId,
			});

			yield* Effect.log("Database seeding completed");
		}),
);
