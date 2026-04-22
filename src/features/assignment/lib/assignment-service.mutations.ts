import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { assignments, assignmentTargets, kits } from "@/server/db/schema/app-schema";

import {
	AssignmentNotFoundError,
	CreateAssignmentInput,
	DeleteAssignmentInput,
	KitNotFoundError,
} from "./assignment-service.shared";

export const createAssignment = Effect.fn("createAssignment")(function* (
	_userId: string,
	data: CreateAssignmentInput,
) {
	const db = yield* Database;

	const kitRows = yield* db
		.select()
		.from(kits)
		.where(eq(kits.goalMapId, data.goalMapId))
		.limit(1);

	const kit = kitRows[0];
	if (!kit) {
		return yield* new KitNotFoundError({ goalMapId: data.goalMapId });
	}

	const assignmentId = randomString();

	yield* db.insert(assignments).values({
		id: assignmentId,
		goalMapId: data.goalMapId,
		kitId: kit.id,
		title: data.title,
		description: data.description,
		readingMaterial: null,
		timeLimitMinutes: null,
		startDate: data.startDate ? new Date(data.startDate) : new Date(),
		dueAt: data.endDate ? new Date(data.endDate) : null,
		preTestFormId: data.preTestFormId,
		postTestFormId: data.postTestFormId,
		delayedPostTestFormId: data.delayedPostTestFormId,
		delayedPostTestDelayDays: data.delayedPostTestDelayDays,
		tamFormId: data.tamFormId,
		createdBy: kit.teacherId,
	});

	const targets: Array<{
		id: string;
		assignmentId: string;
		cohortId?: string;
		userId?: string;
	}> = [];

	for (const cohortId of data.cohortIds) {
		targets.push({
			id: randomString(),
			assignmentId,
			cohortId,
		});
	}

	for (const userId of data.userIds) {
		targets.push({
			id: randomString(),
			assignmentId,
			userId,
		});
	}

	if (targets.length > 0) {
		yield* db.insert(assignmentTargets).values(targets);
	}

	return true;
});

export const deleteAssignment = Effect.fn("deleteAssignment")(function* (
	userId: string,
	input: DeleteAssignmentInput,
) {
	const db = yield* Database;

	const assignmentRows = yield* db
		.select({ createdBy: assignments.createdBy })
		.from(assignments)
		.where(eq(assignments.id, input.id))
		.limit(1);

	const assignment = assignmentRows[0];
	if (!assignment || assignment.createdBy !== userId) {
		return yield* new AssignmentNotFoundError({ assignmentId: input.id });
	}

	yield* db.delete(assignments).where(eq(assignments.id, input.id));

	return true;
});
