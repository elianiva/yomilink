import { eq } from "drizzle-orm";
import { Effect } from "effect";
import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import {
	assignments,
	assignmentTargets,
	kits,
} from "@/server/db/schema/app-schema";
import { cohortMembers, cohorts } from "@/server/db/schema/auth-schema";
import { DEMO_STUDENT_EMAILS } from "../data/users.js";

export function seedDemoData(
	userIdsByEmail: Record<string, string>,
	teacherId: string,
	goalMapIdsByTitle: Record<string, string>,
	goalMapDataByTitle: Record<string, { nodes: unknown[]; edges: Array<{ id: string; source: string; target: string }> }>,
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

		yield* Effect.log("Adding demo students to cohort...");

		const existingMembers = yield* db
			.select()
			.from(cohortMembers)
			.where(eq(cohortMembers.cohortId, demoCohortId));

		const existingMemberIds = new Set(
			existingMembers.map((m) => m.userId),
		);

		yield* Effect.all(
			DEMO_STUDENT_EMAILS.map((studentEmail) =>
				Effect.gen(function* () {
					const studentId = userIdsByEmail[studentEmail];
					if (!studentId) {
						yield* Effect.log(
							`  Student ${studentEmail} not found, skipping...`,
						);
						return;
					}

					if (existingMemberIds.has(studentId)) {
						yield* Effect.log(
							`  ${studentEmail} already in cohort`,
						);
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

		yield* Effect.log("Creating kit for Japanese Daily Life...");
		const dailyLifeGoalMapId = goalMapIdsByTitle["Japanese Daily Life"];
		const dailyLifeData = goalMapDataByTitle["Japanese Daily Life"];

		if (!dailyLifeGoalMapId || !dailyLifeData) {
			yield* Effect.log("Japanese Daily Life goal map not found!");
			return null;
		}

		const dailyLifeGoalMap = yield* db
			.select()
			.from(kits)
			.where(eq(kits.goalMapId, dailyLifeGoalMapId))
			.limit(1);

		const dailyLifeTextId = dailyLifeGoalMap[0]?.textId || null;

		const kitName = "Japanese Daily Life Kit";
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
		const assignmentTitle = "Japanese Daily Life Quiz";

		const existingAssignment = yield* db
			.select()
			.from(assignments)
			.where(eq(assignments.title, assignmentTitle))
			.limit(1);

		const twoWeeksAgo = new Date(
			Date.now() - 14 * 24 * 60 * 60 * 1000,
		);
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

		let demoAssignmentId: string;
		if (existingAssignment[0]) {
			demoAssignmentId = existingAssignment[0].id;
			yield* Effect.log(`  Assignment "${assignmentTitle}" already exists`);
		} else {
			demoAssignmentId = randomString();

			yield* db.insert(assignments).values({
				id: demoAssignmentId,
				goalMapId: dailyLifeGoalMapId,
				kitId: demoKitId,
				title: assignmentTitle,
				description:
					"Learn about daily routines in Japan by creating a concept map.",
				timeLimitMinutes: 30,
				startDate: twoWeeksAgo,
				dueAt: oneWeekAgo,
				createdBy: teacherId,
			});
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

		return {
			demoCohortId,
			demoKitId,
			demoAssignmentId,
			dailyLifeGoalMapId,
			dailyLifeData,
			twoWeeksAgo,
			oneWeekAgo,
		};
	});
}
