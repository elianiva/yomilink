import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentExperimentGroups,
	assignmentTargets,
	kits,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts, user } from "@/server/db/schema/auth-schema";

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
	formIds: {
		tamFormId: string;
		feedbackFormId: string;
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

		yield* Effect.log("Adding demo students to cohort and assigning experiment groups...");

		const existingMembers = yield* db
			.select()
			.from(cohortMembers)
			.where(eq(cohortMembers.cohortId, demoCohortId));

		const existingMemberIds = new Set(existingMembers.map((m) => m.userId));

		const studentConditionMap: Record<string, "concept_map" | "summarizing"> = {};

		yield* Effect.all(
			DEMO_STUDENTS.map((student, index) =>
				Effect.gen(function* () {
					const studentId = userIdsByEmail[student.email];
					if (!studentId) {
						yield* Effect.log(`  Student ${student.email} not found, skipping...`);
						return;
					}

					// Assign condition (50/50 split)
					const condition = index < 5 ? "concept_map" : "summarizing";
					studentConditionMap[student.email] = condition;

					if (existingMemberIds.has(studentId)) {
						yield* Effect.log(`  ${student.email} already in cohort`);
					} else {
						yield* db.insert(cohortMembers).values({
							id: randomString(),
							cohortId: demoCohortId,
							userId: studentId,
							role: "member",
						});
						yield* Effect.log(`  Added ${student.email} to cohort`);
					}
				}),
			),
			{ concurrency: 10 },
		);

		yield* Effect.log("Creating kit for Tanaka's Daily Life...");
		const dailyLifeGoalMapId = goalMapIdsByTitle["Tanaka's Daily Life"];
		const dailyLifeData = goalMapDataByTitle["Tanaka's Daily Life"];

		if (!dailyLifeGoalMapId || !dailyLifeData) {
			yield* Effect.log("Tanaka's Daily Life goal map not found!");
			return null;
		}

		const dailyLifeGoalMap = yield* db
			.select()
			.from(kits)
			.where(eq(kits.goalMapId, dailyLifeGoalMapId))
			.limit(1);

		const dailyLifeTextId = dailyLifeGoalMap[0]?.textId || null;

		const kitName = "Tanaka's Daily Life Kit";
		const existingKit = yield* db.select().from(kits).where(eq(kits.name, kitName)).limit(1);

		let demoKitId: string;
		if (existingKit[0]) {
			demoKitId = existingKit[0].id;
			yield* Effect.log(`  Kit "${kitName}" already exists`);
		} else {
			demoKitId = randomString();
			yield* db.insert(kits).values({
				id: demoKitId,
				kitId: randomString(),
				name: kitName,
				layout: "preset",
				enabled: true,
				goalMapId: dailyLifeGoalMapId,
				teacherId: teacherId,
				textId: dailyLifeTextId,
				nodes: JSON.stringify(dailyLifeData.nodes),
				edges: "[]",
			});
			yield* Effect.log(`  Created kit: ${kitName}`);
		}

		yield* Effect.log("Creating assignment...");
		const assignmentTitle = "Tanaka's Daily Life Quiz";
		const tanakaMaterial = GOAL_MAP_TO_MATERIAL["Tanaka's Daily Life"];
		const readingMaterialContent = tanakaMaterial?.content || "";

		const existingAssignment = yield* db
			.select()
			.from(assignments)
			.where(eq(assignments.title, assignmentTitle))
			.limit(1);

		const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		let demoAssignmentId: string;
		if (existingAssignment[0]) {
			demoAssignmentId = existingAssignment[0].id;
			yield* db
				.update(assignments)
				.set({
					preTestFormId: formIds.preTestFormId,
					postTestFormId: formIds.postTestFormId,
					delayedPostTestFormId: formIds.delayedTestFormId,
					tamFormId: formIds.tamFormId,
					createdBy: teacherId,
					readingMaterial: readingMaterialContent,
				})
				.where(eq(assignments.id, demoAssignmentId));
			yield* Effect.log(
				`  Assignment "${assignmentTitle}" already exists, updated form links and owner`,
			);
		} else {
			demoAssignmentId = randomString();

			yield* db.insert(assignments).values({
				id: demoAssignmentId,
				goalMapId: dailyLifeGoalMapId,
				kitId: demoKitId,
				title: assignmentTitle,
				description: "Learn about daily routines in Japan by creating a concept map.",
				readingMaterial: readingMaterialContent,
				timeLimitMinutes: 30,
				startDate: twoWeeksAgo,
				dueAt: oneWeekAgo,
				preTestFormId: formIds.preTestFormId,
				postTestFormId: formIds.postTestFormId,
				delayedPostTestFormId: formIds.delayedTestFormId,
				tamFormId: formIds.tamFormId,
				createdBy: teacherId,
			});
			yield* db
				.update(assignments)
				.set({ createdBy: teacherId })
				.where(eq(assignments.id, demoAssignmentId));
			yield* Effect.log(`  Created assignment: ${assignmentTitle}`);
		}

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

		yield* Effect.log("Seeding experiment groups...");
		const existingStudents = yield* db.select().from(user).where(eq(user.role, "student"));

		yield* db
			.delete(assignmentExperimentGroups)
			.where(eq(assignmentExperimentGroups.assignmentId, demoAssignmentId));

		for (const s of existingStudents) {
			const condition = studentConditionMap[s.email];
			if (!condition) continue;

			yield* db.insert(assignmentExperimentGroups).values({
				id: randomString(),
				assignmentId: demoAssignmentId,
				userId: s.id,
				condition,
			});
		}
		yield* Effect.log("  Seeded experiment groups (assignment-scoped)");

		return {
			demoCohortId,
			demoKitId,
			demoAssignmentId,
			dailyLifeGoalMapId,
			dailyLifeData,
			twoWeeksAgo,
			oneWeekAgo,
			studentConditionMap,
		};
	});
}
