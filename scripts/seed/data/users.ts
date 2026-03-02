import { Schema } from "effect";

export const SeedUserSchema = Schema.Struct({
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

export type SeedUser = Schema.Schema.Type<typeof SeedUserSchema>;

export const DEFAULT_USERS: readonly SeedUser[] = [
	{
		email: "admin@demo.local",
		password: "admin123",
		name: "Admin",
		roles: ["admin"],
	},
	{
		email: "teacher@demo.local",
		password: "teacher123",
		name: "Teacher One",
		roles: ["teacher"],
	},
];

export interface DemoStudent {
	email: string;
	name: string;
	studentId: string;
	age: number;
	jlptLevel: "N5" | "N4" | "N3" | "N2" | "N1" | "None";
	japaneseLearningDuration: number;
	previousJapaneseScore: number;
	mediaConsumption: number;
	motivation: string;
}

export const DEMO_STUDENTS: DemoStudent[] = [
	{
		email: "tanaka@demo.local",
		name: "Tanaka Yuki",
		studentId: "STD-001",
		age: 20,
		jlptLevel: "N5",
		japaneseLearningDuration: 12,
		previousJapaneseScore: 75,
		mediaConsumption: 15,
		motivation: "Anime and Japanese culture",
	},
	{
		email: "suzuki@demo.local",
		name: "Suzuki Hana",
		studentId: "STD-002",
		age: 19,
		jlptLevel: "N5",
		japaneseLearningDuration: 8,
		previousJapaneseScore: 68,
		mediaConsumption: 20,
		motivation: "Want to study in Japan",
	},
	{
		email: "yamamoto@demo.local",
		name: "Yamamoto Kenji",
		studentId: "STD-003",
		age: 21,
		jlptLevel: "N4",
		japaneseLearningDuration: 18,
		previousJapaneseScore: 82,
		mediaConsumption: 10,
		motivation: "Career opportunities",
	},
	{
		email: "watanabe@demo.local",
		name: "Watanabe Mei",
		studentId: "STD-004",
		age: 20,
		jlptLevel: "N5",
		japaneseLearningDuration: 10,
		previousJapaneseScore: 70,
		mediaConsumption: 25,
		motivation: "J-Pop and manga",
	},
	{
		email: "takahashi@demo.local",
		name: "Takahashi Ryo",
		studentId: "STD-005",
		age: 19,
		jlptLevel: "None",
		japaneseLearningDuration: 6,
		previousJapaneseScore: 65,
		mediaConsumption: 8,
		motivation: "Travel to Japan",
	},
	{
		email: "ito@demo.local",
		name: "Ito Sakura",
		studentId: "STD-006",
		age: 20,
		jlptLevel: "N5",
		japaneseLearningDuration: 14,
		previousJapaneseScore: 78,
		mediaConsumption: 30,
		motivation: "Anime and games",
	},
	{
		email: "nakamura@demo.local",
		name: "Nakamura Sota",
		studentId: "STD-007",
		age: 22,
		jlptLevel: "N4",
		japaneseLearningDuration: 24,
		previousJapaneseScore: 85,
		mediaConsumption: 12,
		motivation: "Business communication",
	},
	{
		email: "kobayashi@demo.local",
		name: "Kobayashi Rin",
		studentId: "STD-008",
		age: 18,
		jlptLevel: "None",
		japaneseLearningDuration: 4,
		previousJapaneseScore: 58,
		mediaConsumption: 18,
		motivation: "Cosplay and events",
	},
	{
		email: "kato@demo.local",
		name: "Kato Haruto",
		studentId: "STD-009",
		age: 21,
		jlptLevel: "N5",
		japaneseLearningDuration: 16,
		previousJapaneseScore: 72,
		mediaConsumption: 6,
		motivation: "Academic research",
	},
	{
		email: "matsumoto@demo.local",
		name: "Matsumoto Yui",
		studentId: "STD-010",
		age: 20,
		jlptLevel: "N5",
		japaneseLearningDuration: 11,
		previousJapaneseScore: 76,
		mediaConsumption: 22,
		motivation: "Japanese dramas",
	},
];

export const DEMO_STUDENT_EMAILS = DEMO_STUDENTS.map((s) => s.email);

export const DEMO_USERS: SeedUser[] = DEMO_STUDENTS.map((s) => ({
	email: s.email,
	password: "demo12345",
	name: s.name,
	roles: ["student"],
}));

export const ALL_USERS: readonly SeedUser[] = [...DEFAULT_USERS, ...DEMO_USERS];
