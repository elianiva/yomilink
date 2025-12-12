import { eq } from "drizzle-orm";
import { Effect, Schema } from "effect";
import { Auth } from "@/lib/auth";
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
		id: "basic-greetings",
		title: "Basic Greetings & Introductions",
		description:
			"Essential Japanese greetings, self-introductions, and basic polite expressions",
		goalMaps: [
			{ id: "greetings-basics", title: "Basic Greetings" },
			{ id: "self-introduction", title: "Self Introduction" },
			{ id: "polite-expressions", title: "Polite Expressions" },
			{ id: "time-greetings", title: "Time-based Greetings" },
			{ id: "farewells", title: "Farewells & Goodbyes" },
		],
	},
	{
		id: "hiragana-katakana",
		title: "Hiragana & Katakana",
		description:
			"Master the Japanese phonetic alphabets - hiragana and katakana",
		goalMaps: [
			{ id: "hiragana-basics", title: "Hiragana Basics" },
			{ id: "katakana-basics", title: "Katakana Basics" },
			{ id: "voiced-sounds", title: "Voiced Sounds (Dakuon)" },
			{ id: "contracted-sounds", title: "Contracted Sounds (Yōon)" },
			{ id: "practice-words", title: "Practice Words" },
		],
	},
	{
		id: "basic-grammar",
		title: "Basic Grammar Patterns",
		description:
			"Fundamental Japanese grammar structures and sentence patterns",
		goalMaps: [
			{ id: "desu-masu", title: "です/ます Forms" },
			{ id: "particles-wa-ga", title: "Particles は/が" },
			{ id: "particles-no-o", title: "Particles の/を" },
			{ id: "particles-ni-de", title: "Particles に/で" },
			{ id: "basic-questions", title: "Basic Questions" },
		],
	},
	{
		id: "numbers-counting",
		title: "Numbers & Counting",
		description: "Japanese number systems, counters, and time expressions",
		goalMaps: [
			{ id: "basic-numbers", title: "Basic Numbers 1-10" },
			{ id: "teen-numbers", title: "Numbers 11-99" },
			{ id: "counters-general", title: "General Counters" },
			{ id: "time-expressions", title: "Time Expressions" },
			{ id: "date-expressions", title: "Date Expressions" },
		],
	},
	{
		id: "daily-life",
		title: "Daily Life & Activities",
		description:
			"Vocabulary and expressions for everyday activities and routines",
		goalMaps: [
			{ id: "morning-routine", title: "Morning Routine" },
			{ id: "daily-activities", title: "Daily Activities" },
			{ id: "hobbies-interests", title: "Hobbies & Interests" },
			{ id: "weather-seasons", title: "Weather & Seasons" },
			{ id: "shopping", title: "Shopping" },
		],
	},
	{
		id: "food-dining",
		title: "Food & Dining",
		description:
			"Japanese food vocabulary, dining etiquette, and restaurant expressions",
		goalMaps: [
			{ id: "basic-foods", title: "Basic Foods" },
			{ id: "restaurant-phrases", title: "Restaurant Phrases" },
			{ id: "dining-etiquette", title: "Dining Etiquette" },
			{ id: "japanese-cuisine", title: "Japanese Cuisine" },
			{ id: "drinks-beverages", title: "Drinks & Beverages" },
		],
	},
	{
		id: "travel-transportation",
		title: "Travel & Transportation",
		description:
			"Essential phrases for traveling in Japan and using public transportation",
		goalMaps: [
			{ id: "airport-travel", title: "Airport Travel" },
			{ id: "train-transport", title: "Train Transportation" },
			{ id: "asking-directions", title: "Asking for Directions" },
			{ id: "hotel-accommodation", title: "Hotel & Accommodation" },
			{ id: "sightseeing", title: "Sightseeing" },
		],
	},
	{
		id: "family-relationships",
		title: "Family & Relationships",
		description: "Family vocabulary and relationship terms in Japanese culture",
		goalMaps: [
			{ id: "immediate-family", title: "Immediate Family" },
			{ id: "extended-family", title: "Extended Family" },
			{ id: "relationship-terms", title: "Relationship Terms" },
			{ id: "honorific-family", title: "Honorific Family Terms" },
			{ id: "describing-people", title: "Describing People" },
		],
	},
	{
		id: "work-school",
		title: "Work & School",
		description:
			"Vocabulary and expressions for professional and academic environments",
		goalMaps: [
			{ id: "school-life", title: "School Life" },
			{ id: "workplace-basics", title: "Workplace Basics" },
			{ id: "business-meetings", title: "Business Meetings" },
			{ id: "academic-subjects", title: "Academic Subjects" },
			{ id: "career-professions", title: "Career & Professions" },
		],
	},
	{
		id: "culture-customs",
		title: "Culture & Customs",
		description: "Japanese cultural concepts, customs, and social etiquette",
		goalMaps: [
			{ id: "social-etiquette", title: "Social Etiquette" },
			{ id: "festivals-holidays", title: "Festivals & Holidays" },
			{ id: "traditional-culture", title: "Traditional Culture" },
			{ id: "modern-culture", title: "Modern Culture" },
			{ id: "cultural-concepts", title: "Cultural Concepts" },
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
		// Insert topic
		yield* Effect.tryPromise({
			try: async () => {
				await db
					.insert(topics)
					.values({
						id: topicData.id,
						title: topicData.title,
						description: topicData.description,
						enabled: true,
					})
					.onConflictDoNothing();

				console.log(`Created topic: ${topicData.title}`);
			},
			catch: (error) =>
				new Error(`Failed to seed topic ${topicData.id}: ${error}`),
		});

		// Insert goal maps for this topic
		for (const mapData of topicData.goalMaps) {
			yield* Effect.tryPromise({
				try: async () => {
					await db
						.insert(goalMaps)
						.values({
							id: mapData.id,
							goalMapId: mapData.id,
							teacherId: teacherId,
							title: mapData.title,
							description: `Goal map for ${mapData.title} in ${topicData.title}`,
							nodes: "[]",
							edges: "[]",
							topicId: topicData.id,
						})
						.onConflictDoNothing();

					console.log(`  Created goal map: ${mapData.title}`);
				},
				catch: (error) =>
					new Error(`Failed to seed goal map ${mapData.id}: ${error}`),
			});
		}
	}

	console.log("Seed completed.");
}).pipe(Effect.provide(Database.Default), Effect.provide(Auth.Default));

Effect.runPromise(program);
