import { and, eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { assignments, assignmentTargets, goalMaps, kits } from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";

import { GOAL_MAP_TO_MATERIAL } from "../data/materials.js";
import { DEMO_STUDENTS } from "../data/users.js";

export function seedDemoData(
	userIdsByEmail: Record<string, string>,
	teacherId: string,
	goalMapIdsByTitle: Record<string, string>,
	goalMapDataByTitle: Record<
		string,
		{ nodes: unknown[]; edges: Array<{ id: string; source: string; target: string }> }
	>,
	testFormIds?: {
		tamFormId: string;
		preTestFormId: string;
		postTestFormId: string;
		delayedTestFormId: string;
	},
) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Creating Demo Data ---");

		const cohortNames = ["2A Business Administration", "2B Business Administration"];
		const cohortIds: string[] = [];

		for (const cohortName of cohortNames) {
			const existingCohort = yield* db
				.select()
				.from(cohorts)
				.where(eq(cohorts.name, cohortName))
				.limit(1);

			if (existingCohort[0]) {
				cohortIds.push(existingCohort[0].id);
				yield* Effect.log("  Cohort " + cohortName + " already exists");
			} else {
				const cohortId = randomString();
				cohortIds.push(cohortId);
				yield* db.insert(cohorts).values({
					id: cohortId,
					name: cohortName,
					description: cohortName + " cohort",
				});
				yield* Effect.log("  Created cohort: " + cohortName);
			}
		}

		const demoCohortId = cohortIds[0];

		yield* Effect.log("Adding demo students to first cohort...");

		const existingMembers = yield* db
			.select()
			.from(cohortMembers)
			.where(eq(cohortMembers.cohortId, demoCohortId));

		const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

		yield* Effect.all(
			DEMO_STUDENTS.map((student) =>
				Effect.gen(function* () {
					const studentId = userIdsByEmail[student.email];
					if (!studentId) {
						yield* Effect.log("  Student " + student.email + " not found, skipping...");
						return;
					}

					if (existingMemberIds.has(studentId)) {
						yield* Effect.log("  " + student.email + " already in cohort");
						return;
					}

					yield* db.insert(cohortMembers).values({
						id: randomString(),
						cohortId: demoCohortId,
						userId: studentId,
						role: "member",
					});
					yield* Effect.log("  Added " + student.email + " to cohort");
				}),
			),
			{ concurrency: 10 },
		);

		const startDate = new Date(Date.now() - 60 * 60 * 1000);
		const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

		const createDemoSet = Effect.fn("createDemoSet")(
			(
				materialTitle: string,
				assignmentTitle: string,
				description: string,
				formIds: {
					tamFormId: string | null;
					preTestFormId: string | null;
					postTestFormId: string | null;
					delayedTestFormId: string | null;
				},
			) =>
				Effect.gen(function* () {
					const goalMapId = goalMapIdsByTitle[materialTitle];
					const goalMapData = goalMapDataByTitle[materialTitle];
					if (!goalMapId || !goalMapData) return null;

					const goalMap = yield* db
						.select()
						.from(goalMaps)
						.where(eq(goalMaps.id, goalMapId))
						.limit(1);
					const textId = goalMap[0]?.textId || null;

					const kitName = `${materialTitle} Kit`;
					const existingKit = yield* db
						.select()
						.from(kits)
						.where(eq(kits.name, kitName))
						.limit(1);

					let demoKitId: string;
					if (existingKit[0]) {
						demoKitId = existingKit[0].id;
						yield* db
							.update(kits)
							.set({
								kitId: existingKit[0].kitId,
								name: kitName,
								layout: "preset",
								enabled: true,
								goalMapId,
								teacherId,
								textId,
								nodes: JSON.stringify(goalMapData.nodes),
								edges: "[]",
							})
							.where(eq(kits.id, demoKitId));
					} else {
						demoKitId = randomString();
						yield* db.insert(kits).values({
							id: demoKitId,
							kitId: randomString(),
							name: kitName,
							layout: "preset",
							enabled: true,
							goalMapId,
							teacherId,
							textId,
							nodes: JSON.stringify(goalMapData.nodes),
							edges: "[]",
						});
					}

					const readingMaterialContent =
						GOAL_MAP_TO_MATERIAL[materialTitle]?.content || "";
					const existingAssignment = yield* db
						.select()
						.from(assignments)
						.where(eq(assignments.title, assignmentTitle))
						.limit(1);

					let demoAssignmentId: string;
					if (existingAssignment[0]) {
						demoAssignmentId = existingAssignment[0].id;
						yield* db
							.update(assignments)
							.set({
								goalMapId,
								kitId: demoKitId,
								title: assignmentTitle,
								description,
								readingMaterial: readingMaterialContent,
								timeLimitMinutes: 20,
								startDate,
								dueAt,
								preTestFormId: formIds.preTestFormId,
								postTestFormId: formIds.postTestFormId,
								delayedPostTestFormId: formIds.delayedTestFormId,
								tamFormId: formIds.tamFormId,
								createdBy: teacherId,
							})
							.where(eq(assignments.id, demoAssignmentId));
					} else {
						demoAssignmentId = randomString();
						yield* db.insert(assignments).values({
							id: demoAssignmentId,
							goalMapId,
							kitId: demoKitId,
							title: assignmentTitle,
							description,
							readingMaterial: readingMaterialContent,
							timeLimitMinutes: 20,
							startDate,
							dueAt,
							preTestFormId: formIds.preTestFormId,
							postTestFormId: formIds.postTestFormId,
							delayedPostTestFormId: formIds.delayedTestFormId,
							tamFormId: formIds.tamFormId,
							createdBy: teacherId,
						});
					}

					return { demoAssignmentId, demoKitId, goalMapId, goalMapData };
				}),
		);

		const dailyLifeSet = yield* createDemoSet(
			"わたしのうち",
			"わたしのうち Demo Assignment",
			"Demo assignment for the わたしのうち reading passage about a quiet neighborhood.",
			{
				tamFormId: testFormIds?.tamFormId ?? null,
				preTestFormId: testFormIds?.preTestFormId ?? null,
				postTestFormId: testFormIds?.postTestFormId ?? null,
				delayedTestFormId: testFormIds?.delayedTestFormId ?? null,
			},
		);
		if (!dailyLifeSet) {
			yield* Effect.log("わたしのうち goal map not found!");
			return null;
		}

		const demoAssignmentId = dailyLifeSet.demoAssignmentId;
		const demoKitId = dailyLifeSet.demoKitId;
		const goalMapId = dailyLifeSet.goalMapId;
		const goalMapData = dailyLifeSet.goalMapData;
		yield* Effect.log("Linking assignment to cohorts...");
		for (const assignmentId of [dailyLifeSet.demoAssignmentId]) {
			for (const cohortId of cohortIds) {
				const existingTarget = yield* db
					.select()
					.from(assignmentTargets)
					.where(
						and(
							eq(assignmentTargets.assignmentId, assignmentId),
							eq(assignmentTargets.cohortId, cohortId),
						),
					)
					.limit(1);

				if (existingTarget[0]) continue;
				yield* db.insert(assignmentTargets).values({
					id: randomString(),
					assignmentId,
					cohortId,
					userId: null,
				});
			}
		}

		return {
			demoCohortId,
			demoKitId,
			demoAssignmentId,
			dailyLifeGoalMapId: goalMapId,
			dailyLifeData: goalMapData,
		};
	});
}
