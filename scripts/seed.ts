import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { Auth } from "@/lib/auth";
import { randomString } from "@/lib/utils";
import { Database, DatabaseLive } from "@/server/db/client";
import { goalMaps, texts, topics } from "@/server/db/schema/app-schema";
import { user } from "@/server/db/schema/auth-schema";

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

const program = Effect.gen(function* () {
	const authService = yield* Auth;
	const db = yield* Database;

	console.log("Seeding database...");

	// Seed users first
	console.log(`Seeding ${DEFAULT_USERS.length} users...`);
	let teacherId = "";

	for (const seedUser of DEFAULT_USERS) {
		// Try to find existing user first
		const existingUser = yield* Effect.tryPromise(() =>
			db.select().from(user).where(eq(user.email, seedUser.email)).limit(1),
		);

		let userId = "";
		if (existingUser[0]) {
			userId = existingUser[0].id;
			console.log(`User ${seedUser.email} already exists`);
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
				console.log(`Created user: ${seedUser.email}`);
			}
		}

		// Set user's role
		if (userId && seedUser.roles?.[0]) {
			yield* Effect.tryPromise({
				try: async () => {
					await db
						.update(user)
						.set({ role: seedUser.roles?.[0] })
						.where(eq(user.id, userId));
					console.log(
						`Set role '${seedUser.roles?.[0]}' for ${seedUser.email}`,
					);
				},
				catch: (error) =>
					new Error(`Failed to set role for ${seedUser.email}: ${error}`),
			});
		}

		// Track teacher ID for goal maps
		if (seedUser.roles?.includes("teacher")) {
			teacherId = userId;
		}
	}

	// Seed topics and goal maps from materials
	console.log(
		`Seeding ${TOPICS.length} topics with ${MATERIALS.length} goal maps...`,
	);

	for (const topicData of TOPICS) {
		// Check if topic exists by title
		const existingTopic = yield* Effect.tryPromise(() =>
			db
				.select()
				.from(topics)
				.where(eq(topics.title, topicData.title))
				.limit(1),
		);

		let topicId: string;
		if (existingTopic[0]) {
			topicId = existingTopic[0].id;
			yield* Effect.tryPromise({
				try: async () => {
					await db
						.update(topics)
						.set({ description: topicData.description })
						.where(eq(topics.id, topicId));
				},
				catch: (error) =>
					new Error(`Failed to update topic ${topicData.title}: ${error}`),
			});
			console.log(`Updated topic: ${topicData.title}`);
		} else {
			topicId = randomString();
			yield* Effect.tryPromise({
				try: async () => {
					await db.insert(topics).values({
						id: topicId,
						title: topicData.title,
						description: topicData.description,
					});
				},
				catch: (error) =>
					new Error(`Failed to create topic ${topicData.title}: ${error}`),
			});
			console.log(`Created topic: ${topicData.title}`);
		}

		// Insert goal maps for this topic from materials
		for (const mapTitle of topicData.goalMapTitles) {
			const material = GOAL_MAP_TO_MATERIAL[mapTitle];

			if (!material) {
				console.warn(`No material found for: ${mapTitle}`);
				continue;
			}

			// Check if text exists by title
			const existingText = yield* Effect.tryPromise(() =>
				db.select().from(texts).where(eq(texts.title, material.title)).limit(1),
			);

			let textId: string;
			if (existingText[0]) {
				textId = existingText[0].id;
				yield* Effect.tryPromise({
					try: async () => {
						await db
							.update(texts)
							.set({ content: material.content })
							.where(eq(texts.id, textId));
					},
					catch: (error) =>
						new Error(`Failed to update text for ${material.title}: ${error}`),
				});
			} else {
				textId = randomString();
				yield* Effect.tryPromise({
					try: async () => {
						await db.insert(texts).values({
							id: textId,
							title: material.title,
							content: material.content,
						});
					},
					catch: (error) =>
						new Error(`Failed to create text for ${material.title}: ${error}`),
				});
			}

			// Check if goal map exists by title
			const existingGoalMap = yield* Effect.tryPromise(() =>
				db
					.select()
					.from(goalMaps)
					.where(eq(goalMaps.title, material.title))
					.limit(1),
			);

			if (existingGoalMap[0]) {
				yield* Effect.tryPromise({
					try: async () => {
						await db
							.update(goalMaps)
							.set({
								description: material.description,
								nodes: JSON.stringify(material.nodes),
								edges: JSON.stringify(material.edges),
							})
							.where(eq(goalMaps.id, existingGoalMap[0].id));
					},
					catch: (error) =>
						new Error(`Failed to update goal map ${material.title}: ${error}`),
				});
				console.log(`  Updated goal map: ${material.title}`);
			} else {
				const goalMapId = randomString();
				yield* Effect.tryPromise({
					try: async () => {
						await db.insert(goalMaps).values({
							id: goalMapId,
							teacherId: teacherId,
							title: material.title,
							description: material.description,
							nodes: JSON.stringify(material.nodes),
							edges: JSON.stringify(material.edges),
							topicId: topicId,
							textId: textId,
						});
					},
					catch: (error) =>
						new Error(`Failed to create goal map ${material.title}: ${error}`),
				});
				console.log(`  Created goal map: ${material.title}`);
			}
		}
	}

	console.log("Seed completed.");
}).pipe(Effect.provide(Layer.mergeAll(DatabaseLive, Auth.Default)));

Effect.runPromise(program);
