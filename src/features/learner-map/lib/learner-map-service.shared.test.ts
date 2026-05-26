import { describe, expect, it } from "vite-plus/test";

import { mapStudyGroupToCondition } from "./learner-map-service.shared";

describe("mapStudyGroupToCondition", () => {
	it("should map 'experiment' to 'concept_map'", () => {
		expect(mapStudyGroupToCondition("experiment")).toBe("concept_map");
	});

	it("should map 'control' to 'summarizing'", () => {
		expect(mapStudyGroupToCondition("control")).toBe("summarizing");
	});

	it("should map null to 'summarizing'", () => {
		expect(mapStudyGroupToCondition(null)).toBe("summarizing");
	});
});
