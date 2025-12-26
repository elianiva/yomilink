import { nanoid } from "nanoid";
import { Effect } from "effect";
import * as schema from "@/server/db/schema";
import { Database } from "@/server/db/client";

export const seedDb = Effect.gen(function* () {
	const db = yield* Database;

	const userId = `user-${nanoid()}`;
	const user = {
		id: userId,
		email: `test-${nanoid()}@example.com`,
		emailVerified: true,
		name: "Test User",
		image: null,
	};

	yield* Effect.tryPromise(() => db.insert(schema.users).values(user));

	const topicId = `topic-${nanoid()}`;
	const topic = {
		id: topicId,
		name: "Test Topic",
		createdBy: userId,
		description: "Test topic for seeding",
	};

	yield* Effect.tryPromise(() => db.insert(schema.topics).values(topic));

	const materialId = `material-${nanoid()}`;
	const material = {
		id: materialId,
		topicId,
		title: "Test Material",
		content: JSON.stringify({
			nodes: [
				{ id: "node1", label: "Concept 1", position: { x: 100, y: 100 } },
			],
			edges: [{ id: "edge1", source: "node1", target: "node1" }],
		}),
		type: "hiragana" as const,
	};

	yield* Effect.tryPromise(() => db.insert(schema.materials).values(material));

	const goalMapId = `goalmap-${nanoid()}`;
	const goalMap = {
		id: goalMapId,
		topicId,
		materialId,
		metadata: {
			createdBy: userId,
			description: "Test goal map",
			name: "Test Goal Map",
		},
	};

	yield* Effect.tryPromise(() => db.insert(schema.goalMaps).values(goalMap));

	const classroomId = `classroom-${nanoid()}`;
	const classroom = {
		id: classroomId,
		name: "Test Classroom",
		createdBy: userId,
	};

	yield* Effect.tryPromise(() =>
		db.insert(schema.classrooms).values(classroom),
	);

	const learnerId = `learner-${nanoid()}`;
	const learner = {
		id: learnerId,
		name: "Test Learner",
		classroomId,
	};

	yield* Effect.tryPromise(() => db.insert(schema.learners).values(learner));

	const assignmentId = `assignment-${nanoid()}`;
	const assignment = {
		id: assignmentId,
		goalMapId,
		classroomId,
		materialId,
		title: "Test Assignment",
		createdAt: new Date(),
	};

	yield* Effect.tryPromise(() =>
		db.insert(schema.assignments).values(assignment),
	);

	const learnerMapId = `learnermap-${nanoid()}`;
	const learnerMap = {
		id: learnerMapId,
		assignmentId,
		learnerId,
		content: JSON.stringify({
			nodes: [
				{ id: "node1", label: "Concept 1", position: { x: 100, y: 100 } },
			],
			edges: [{ id: "edge1", source: "node1", target: "node1" }],
		}),
		createdAt: new Date(),
	};

	yield* Effect.tryPromise(() =>
		db.insert(schema.learnerMaps).values(learnerMap),
	);

	return {
		user,
		topic,
		material,
		goalMap,
		classroom,
		learner,
		assignment,
		learnerMap,
	};
});

export const cleanDb = Effect.gen(function* () {
	const db = yield* Database;

	yield* Effect.tryPromise(() => db.delete(schema.learnerMaps));
	yield* Effect.tryPromise(() => db.delete(schema.assignments));
	yield* Effect.tryPromise(() => db.delete(schema.learners));
	yield* Effect.tryPromise(() => db.delete(schema.classrooms));
	yield* Effect.tryPromise(() => db.delete(schema.goalMaps));
	yield* Effect.tryPromise(() => db.delete(schema.materials));
	yield* Effect.tryPromise(() => db.delete(schema.topics));
	yield* Effect.tryPromise(() => db.delete(schema.users));
});
