import type { Node, Edge } from "@/features/learner-map/lib/comparator";

export const testGoalMapNodes: ReadonlyArray<Node> = [
	{
		id: "root",
		type: "text",
		data: { label: "Concept" },
		position: { x: 0, y: 0 },
	},
	{
		id: "child1",
		type: "text",
		data: { label: "Child 1" },
		position: { x: 100, y: 100 },
	},
	{
		id: "link",
		type: "connector",
		data: { label: "is" },
		position: { x: 50, y: 50 },
	},
];

export const testGoalMapEdges: ReadonlyArray<Edge> = [
	{ id: "edge1", source: "root", target: "link" },
	{ id: "edge2", source: "link", target: "child1" },
];

export const testLearnerMapNodes: ReadonlyArray<Node> = [
	{
		id: "root",
		type: "text",
		data: { label: "Concept" },
		position: { x: 0, y: 0 },
	},
	{
		id: "child1",
		type: "text",
		data: { label: "Child 1" },
		position: { x: 100, y: 100 },
	},
	{
		id: "link",
		type: "connector",
		data: { label: "is" },
		position: { x: 50, y: 50 },
	},
];

export const testLearnerMapEdges: ReadonlyArray<Edge> = [
	{ id: "edge1", source: "root", target: "link" },
];

export const testTeacherId = "teacher-1";

export const testStudentId = "student-1";

export const testCohortId = "cohort-1";

export const testTopicId = "topic-1";

export const testGoalMapId = "goalmap-1";

export const testKitId = "kit-1";

export const testAssignmentId = "assignment-1";

export const testLearnerMapId = "learnermap-1";

export const testDiagnosisId = "diagnosis-1";

export const testMaterialImageId = "image-1";
