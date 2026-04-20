import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { assignments, assignmentTargets, goalMaps, kits } from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";

import { GOAL_MAP_TO_MATERIAL } from "../data/materials.js";
import { DEMO_STUDENTS } from "../data/users.js";
import { WHITELIST_FLOW_ACCOUNTS } from "../data/whitelist-flow.js";

const COHORT_STUDENTS = [...DEMO_STUDENTS, ...WHITELIST_FLOW_ACCOUNTS];

export function seedDemoData(
	userIdsByEmail: Record<string, string>,
	teacherId: string,
	goalMapIdsByTitle: Record<string, string>,
	goalMapDataByTitle: Record<
		string,
		{ nodes: unknown[]; edges: Array<{ id: string; source: string; target: string }> }
	>,
	testFormIds?: {
		preTestFormId: string;
		postTestFormId: string;
		delayedTestFormId: string;
	},
) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Creating Demo Data ---");

		const demoCohortName = "Demo Class 2025";
		const existingCohort = yield* db
			.select()
			.from(cohorts)
			.where(eq(cohorts.name, demoCohortName))
			.limit(1);

		let demoCohortId: string;
		if (existingCohort[0]) {
			demoCohortId = existingCohort[0].id;
			yield* db
				.update(cohorts)
				.set({ description: "Single demo class for the simplified seed" })
				.where(eq(cohorts.id, demoCohortId));
			yield* Effect.log("  Cohort " + demoCohortName + " already exists");
		} else {
			demoCohortId = randomString();
			yield* db.insert(cohorts).values({
				id: demoCohortId,
				name: demoCohortName,
				description: "Single demo class for the simplified seed",
			});
			yield* Effect.log("  Created cohort: " + demoCohortName);
		}

		yield* Effect.log("Adding demo students to cohort...");

		const existingMembers = yield* db
			.select()
			.from(cohortMembers)
			.where(eq(cohortMembers.cohortId, demoCohortId));

		const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

		yield* Effect.all(
			COHORT_STUDENTS.map((student) =>
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

		yield* Effect.log("Creating kit for Japan: Main Islands and Cities...");
		const dailyLifeGoalMapId = goalMapIdsByTitle["Japan: Main Islands and Cities"];
		const dailyLifeData = goalMapDataByTitle["Japan: Main Islands and Cities"];

		if (!dailyLifeGoalMapId || !dailyLifeData) {
			yield* Effect.log("Japan map goal map not found!");
			return null;
		}

		const dailyLifeGoalMap = yield* db
			.select()
			.from(goalMaps)
			.where(eq(goalMaps.id, dailyLifeGoalMapId))
			.limit(1);

		const dailyLifeTextId = dailyLifeGoalMap[0]?.textId || null;

		const kitName = "Japan Islands Tree Kit";
		const existingKit = yield* db.select().from(kits).where(eq(kits.name, kitName)).limit(1);

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
					goalMapId: dailyLifeGoalMapId,
					teacherId,
					textId: dailyLifeTextId,
					nodes: JSON.stringify(dailyLifeData.nodes),
					edges: "[]",
				})
				.where(eq(kits.id, demoKitId));
			yield* Effect.log("  Updated kit: " + kitName);
		} else {
			demoKitId = randomString();
			yield* db.insert(kits).values({
				id: demoKitId,
				kitId: randomString(),
				name: kitName,
				layout: "preset",
				enabled: true,
				goalMapId: dailyLifeGoalMapId,
				teacherId,
				textId: dailyLifeTextId,
				nodes: JSON.stringify(dailyLifeData.nodes),
				edges: "[]",
			});
			yield* Effect.log("  Created kit: " + kitName);
		}

		yield* Effect.log("Creating assignment...");
		const assignmentTitle = "Japan Islands Tree Demo";
		const readingMaterialContent = GOAL_MAP_TO_MATERIAL["Japan: Main Islands and Cities"]?.content || "";
		const existingAssignment = yield* db
			.select()
			.from(assignments)
			.where(eq(assignments.title, assignmentTitle))
			.limit(1);

		const startDate = new Date(Date.now() - 60 * 60 * 1000);
		const dueAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
		const preTestFormId = testFormIds?.preTestFormId ?? null;
		const postTestFormId = testFormIds?.postTestFormId ?? null;
		const delayedTestFormId = testFormIds?.delayedTestFormId ?? null;

		let demoAssignmentId: string;
		if (existingAssignment[0]) {
			demoAssignmentId = existingAssignment[0].id;
			yield* db
				.update(assignments)
				.set({
					goalMapId: dailyLifeGoalMapId,
					kitId: demoKitId,
					title: assignmentTitle,
					description: "Simple demo assignment for Japan's three main islands and their major cities.",
					readingMaterial: readingMaterialContent,
					timeLimitMinutes: 20,
					startDate,
					dueAt,
					preTestFormId,
					postTestFormId,
					delayedPostTestFormId: delayedTestFormId,
					tamFormId: null,
					createdBy: teacherId,
				})
				.where(eq(assignments.id, demoAssignmentId));
			yield* Effect.log("  Updated assignment: " + assignmentTitle);
		} else {
			demoAssignmentId = randomString();
			yield* db.insert(assignments).values({
				id: demoAssignmentId,
				goalMapId: dailyLifeGoalMapId,
				kitId: demoKitId,
				title: assignmentTitle,
				description: "Simple demo assignment for Japan's three main islands and their major cities.",
				readingMaterial: readingMaterialContent,
				timeLimitMinutes: 20,
				startDate,
				dueAt,
				preTestFormId,
				postTestFormId,
				delayedPostTestFormId: delayedTestFormId,
				tamFormId: null,
				createdBy: teacherId,
			});
			yield* Effect.log("  Created assignment: " + assignmentTitle);
		}

		yield* Effect.log("Linking assignment to cohort...");
		const existingTarget = yield* db
			.select()
			.from(assignmentTargets)
			.where(eq(assignmentTargets.assignmentId, demoAssignmentId))
			.limit(1);

		if (existingTarget[0]) {
			yield* db
				.update(assignmentTargets)
				.set({ cohortId: demoCohortId, userId: null })
				.where(eq(assignmentTargets.id, existingTarget[0].id));
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

		return {
			demoCohortId,
			demoKitId,
			demoAssignmentId,
			dailyLifeGoalMapId,
			dailyLifeData,
		};
	});
}
