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
	studyGroup: Schema.optionalWith(
		Schema.Union(Schema.Literal("experiment"), Schema.Literal("control")),
		{
			nullable: true,
		},
	),
});

export type SeedUser = Schema.Schema.Type<typeof SeedUserSchema>;

export const DEFAULT_USERS: readonly SeedUser[] = [
	{
		email: "admin@kitbuild.mail",
		password: "admin123",
		name: "Admin",
		roles: ["admin"],
	},
	{
		email: "banni@kitbuild.mail",
		password: "banni12345",
		name: "Banni",
		roles: ["teacher"],
	},
	{
		email: "helmy@kitbuild.mail",
		password: "helmy12345",
		name: "Helmy",
		roles: ["teacher"],
	},
	{
		email: "dicha@kitbuild.mail",
		password: "dicha12345",
		name: "Dicha",
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
	studyGroup: "experiment" | "control";
}

export const DEMO_STUDENTS: DemoStudent[] = [
	{
		email: "tanaka@kitbuild.mail",
		name: "Yuki",
		studentId: "STD-001",
		age: 20,
		jlptLevel: "N5",
		japaneseLearningDuration: 12,
		previousJapaneseScore: 75,
		mediaConsumption: 15,
		motivation: "Anime and Japanese culture",
		studyGroup: "experiment",
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
