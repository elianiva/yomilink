import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Auth } from "@/lib/auth";
import { Database } from "@/server/db/client";
import { user } from "@/server/db/schema/auth-schema";

import { ALL_USERS, DEFAULT_USERS, DEMO_STUDENTS } from "../data/users.js";

export function seedUsers() {
	return Effect.gen(function* () {
		const authService = yield* Auth;
		const db = yield* Database;

		yield* Effect.log(`Seeding ${ALL_USERS.length} users...`);

		const userIdsByEmail: Record<string, string> = {};
		let teacherId = "";

		// Process sequentially to avoid database locks with Better Auth
		for (const seedUser of ALL_USERS) {
			const result = yield* Effect.gen(function* () {
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
					const signupResult = yield* Effect.tryPromise({
						try: () =>
							authService.api.signUpEmail({
								body: {
									email: seedUser.email,
									password: seedUser.password,
									name: seedUser.name as string,
									studyGroup: "experiment",
								},
							}),
						catch: (error) => {
							console.error(`Failed to create user ${seedUser.email}:`, error);
							return { user: null };
						},
					});
					if (signupResult.user) {
						userId = signupResult.user.id;
						yield* Effect.log(`Created user: ${seedUser.email}`);
					}
				}

				if (userId && seedUser.roles?.[0]) {
					yield* db
						.update(user)
						.set({ role: seedUser.roles?.[0] })
						.where(eq(user.id, userId));
					yield* Effect.log(`Set role '${seedUser.roles?.[0]}' for ${seedUser.email}`);
				}

				const demoStudent = DEMO_STUDENTS.find((s) => s.email === seedUser.email);
				if (userId && demoStudent) {
					yield* db
						.update(user)
						.set({
							studentId: demoStudent.studentId,
							age: demoStudent.age,
							jlptLevel: demoStudent.jlptLevel,
							japaneseLearningDuration: demoStudent.japaneseLearningDuration,
							previousJapaneseScore: demoStudent.previousJapaneseScore,
							mediaConsumption: demoStudent.mediaConsumption,
							motivation: demoStudent.motivation,
									studyGroup: "experiment",
						})
						.where(eq(user.id, userId));
					yield* Effect.log(`Set demographic data for ${seedUser.email}`);
				}

				return {
					email: seedUser.email,
					userId,
					roles: seedUser.roles,
				};
			});

			userIdsByEmail[result.email] = result.userId;
			if (result.roles?.includes("teacher")) {
				teacherId = result.userId;
			}
		}

		return { userIdsByEmail, teacherId };
	});
}

// Seed only core users (admin + teacher), no students
export function seedCoreUsers() {
	return Effect.gen(function* () {
		const authService = yield* Auth;
		const db = yield* Database;

		yield* Effect.log(`Seeding ${DEFAULT_USERS.length} core users...`);

		let teacherId = "";

		for (const seedUser of DEFAULT_USERS) {
			const result = yield* Effect.gen(function* () {
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
					const signupResult = yield* Effect.tryPromise({
						try: () =>
							authService.api.signUpEmail({
								body: {
									email: seedUser.email,
									password: seedUser.password,
									name: seedUser.name as string,
								},
							}),
						catch: (error) => {
							console.error(`Failed to create user ${seedUser.email}:`, error);
							return { user: null };
						},
					});
					if (signupResult.user) {
						userId = signupResult.user.id;
						yield* Effect.log(`Created user: ${seedUser.email}`);
					}
				}

				if (userId && seedUser.roles?.[0]) {
					yield* db
						.update(user)
						.set({ role: seedUser.roles?.[0] })
						.where(eq(user.id, userId));
					yield* Effect.log(`Set role '${seedUser.roles?.[0]}' for ${seedUser.email}`);
				}

				return {
					email: seedUser.email,
					userId,
					roles: seedUser.roles,
				};
			});

			if (result.roles?.includes("teacher")) {
				teacherId = result.userId;
			}
		}

		return { teacherId };
	});
}
