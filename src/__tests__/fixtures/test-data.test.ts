import { describe, expect, it } from "vitest";
import {
	testGoalMapNodes,
	testGoalMapEdges,
	testLearnerMapNodes,
	testLearnerMapEdges,
	testTeacherId,
	testStudentId,
} from "./test-data";

describe("test fixtures", () => {
	it("should have valid test data", () => {
		expect(testGoalMapNodes).toBeDefined();
		expect(testGoalMapEdges).toBeDefined();
		expect(testLearnerMapNodes).toBeDefined();
		expect(testLearnerMapEdges).toBeDefined();
		expect(testTeacherId).toBe("teacher-1");
		expect(testStudentId).toBe("student-1");
	});

	it("should have goal map with required structure", () => {
		expect(testGoalMapNodes.length).toBeGreaterThan(0);
		expect(testGoalMapEdges.length).toBeGreaterThan(0);
		expect(testGoalMapNodes[0]?.id).toBeDefined();
		expect(testGoalMapEdges[0]?.id).toBeDefined();
		expect(testGoalMapEdges[0]?.source).toBeDefined();
		expect(testGoalMapEdges[0]?.target).toBeDefined();
	});

	it("should have learner map with required structure", () => {
		expect(testLearnerMapNodes.length).toBeGreaterThan(0);
		expect(testLearnerMapEdges.length).toBeGreaterThan(0);
		expect(testLearnerMapNodes[0]?.id).toBeDefined();
		expect(testLearnerMapEdges[0]?.id).toBeDefined();
		expect(testLearnerMapEdges[0]?.source).toBeDefined();
		expect(testLearnerMapEdges[0]?.target).toBeDefined();
	});
});
