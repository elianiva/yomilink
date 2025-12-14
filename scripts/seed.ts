import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { Auth } from "@/lib/auth";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { goalMaps, topics } from "@/server/db/schema/app-schema";
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

// Japanese language learning topics data
const JAPANESE_TOPICS = [
	{
		title: "Basic Greetings & Introductions",
		description:
			"Essential Japanese greetings, self-introductions, and basic polite expressions",
		goalMaps: [
			{ title: "Basic Greetings" },
			{ title: "Self Introduction" },
			{ title: "Polite Expressions" },
			{ title: "Time-based Greetings" },
			{ title: "Farewells & Goodbyes" },
		],
	},
	{
		title: "Hiragana & Katakana",
		description:
			"Master the Japanese phonetic alphabets - hiragana and katakana",
		goalMaps: [
			{ title: "Hiragana Basics" },
			{ title: "Katakana Basics" },
			{ title: "Voiced Sounds (Dakuon)" },
			{ title: "Contracted Sounds (Yoon)" },
			{ title: "Practice Words" },
		],
	},
	{
		title: "Basic Grammar Patterns",
		description:
			"Fundamental Japanese grammar structures and sentence patterns",
		goalMaps: [
			{ title: "desu/masu Forms" },
			{ title: "Particles wa/ga" },
			{ title: "Particles no/o" },
			{ title: "Particles ni/de" },
			{ title: "Basic Questions" },
		],
	},
	{
		title: "Numbers & Counting",
		description: "Japanese number systems, counters, and time expressions",
		goalMaps: [
			{ title: "Basic Numbers 1-10" },
			{ title: "Numbers 11-99" },
			{ title: "General Counters" },
			{ title: "Time Expressions" },
			{ title: "Date Expressions" },
		],
	},
	{
		title: "Daily Life & Activities",
		description:
			"Vocabulary and expressions for everyday activities and routines",
		goalMaps: [
			{ title: "Morning Routine" },
			{ title: "Daily Activities" },
			{ title: "Hobbies & Interests" },
			{ title: "Weather & Seasons" },
			{ title: "Shopping" },
		],
	},
	{
		title: "Food & Dining",
		description:
			"Japanese food vocabulary, dining etiquette, and restaurant expressions",
		goalMaps: [
			{ title: "Basic Foods" },
			{ title: "Restaurant Phrases" },
			{ title: "Dining Etiquette" },
			{ title: "Japanese Cuisine" },
			{ title: "Drinks & Beverages" },
		],
	},
	{
		title: "Travel & Transportation",
		description:
			"Essential phrases for traveling in Japan and using public transportation",
		goalMaps: [
			{ title: "Airport Travel" },
			{ title: "Train Transportation" },
			{ title: "Asking for Directions" },
			{ title: "Hotel & Accommodation" },
			{ title: "Sightseeing" },
		],
	},
	{
		title: "Family & Relationships",
		description: "Family vocabulary and relationship terms in Japanese culture",
		goalMaps: [
			{ title: "Immediate Family" },
			{ title: "Extended Family" },
			{ title: "Relationship Terms" },
			{ title: "Honorific Family Terms" },
			{ title: "Describing People" },
		],
	},
	{
		title: "Work & School",
		description:
			"Vocabulary and expressions for professional and academic environments",
		goalMaps: [
			{ title: "School Life" },
			{ title: "Workplace Basics" },
			{ title: "Business Meetings" },
			{ title: "Academic Subjects" },
			{ title: "Career & Professions" },
		],
	},
	{
		title: "Culture & Customs",
		description: "Japanese cultural concepts, customs, and social etiquette",
		goalMaps: [
			{ title: "Social Etiquette" },
			{ title: "Festivals & Holidays" },
			{ title: "Traditional Culture" },
			{ title: "Modern Culture" },
			{ title: "Cultural Concepts" },
		],
	},
];

const program = Effect.gen(function* () {
	const authService = yield* Auth;
	const db = yield* Database;

	console.log("Seeding database...");

	// Seed users first
	console.log(`Seeding ${DEFAULT_USERS.length} users...`);
	const teacherId = yield* Effect.tryPromise({
		try: async () => {
			const result = await authService.api.signUpEmail({
				body: {
					email: "teacher@yomilink.local",
					password: "teacher123",
					name: "Teacher One",
				},
			});

			if (result.user) {
				console.log(`Created user: teacher@yomilink.local`);
				return result.user.id;
			} else {
				// User already exists, get their ID
				const existingUser = await db
					.select()
					.from(user)
					.where(eq(user.email, "teacher@yomilink.local"))
					.limit(1);
				return existingUser[0]?.id || "";
			}
		},
		catch: (error) => new Error(`Failed to seed teacher: ${error}`),
	});

	// Seed other users
	for (const user of DEFAULT_USERS.filter(
		(u) => u.email !== "teacher@yomilink.local",
	)) {
		yield* Effect.tryPromise({
			try: async () => {
				const result = await authService.api.signUpEmail({
					body: {
						email: user.email,
						password: user.password,
						name: user.name as string,
					},
				});

				if (result.user) {
					console.log(`Created user: ${user.email}`);
				} else {
					console.log(`User ${user.email} already exists`);
				}
			},
			catch: (error) =>
				new Error(`Failed to seed user ${user.email}: ${error}`),
		});
	}

	// Seed topics and goal maps
	console.log(`Seeding ${JAPANESE_TOPICS.length} topics with goal maps...`);

	for (const topicData of JAPANESE_TOPICS) {
		const topicId = randomString();

		// Insert topic
		yield* Effect.tryPromise({
			try: async () => {
				await db
					.insert(topics)
					.values({
						id: topicId,
						title: topicData.title,
						description: topicData.description,
					})
					.onConflictDoNothing();

				console.log(`Created topic: ${topicData.title}`);
			},
			catch: (error) =>
				new Error(`Failed to seed topic ${topicData.title}: ${error}`),
		});

		// Insert goal maps for this topic
		for (const mapData of topicData.goalMaps) {
			const goalMapId = randomString();

			yield* Effect.tryPromise({
				try: async () => {
					await db
						.insert(goalMaps)
						.values({
							id: goalMapId,
							teacherId: teacherId,
							title: mapData.title,
							description: `Goal map for ${mapData.title} in ${topicData.title}`,
							edges: [],
							nodes: [],
							topicId: topicId,
						})
						.onConflictDoNothing();

					console.log(`  Created goal map: ${mapData.title}`);
				},
				catch: (error) =>
					new Error(`Failed to seed goal map ${mapData.title}: ${error}`),
			});
		}
	}

	console.log("Seed completed.");
}).pipe(Effect.provide(Database.Default), Effect.provide(Auth.Default));

Effect.runPromise(program);
