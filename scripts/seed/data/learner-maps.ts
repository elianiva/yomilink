export interface LearnerMapConfig {
	studentEmail: string;
	attempt: number;
	correctEdgeIds: string[];
	excessiveEdges: Array<{ source: string; target: string }>;
	expectedScore: number;
}

export const LEARNER_MAP_CONFIGS: LearnerMapConfig[] = [
	{
		studentEmail: "tanaka@kitbuild.mail",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			"e12",
			"e13",
			"e14",
		],
		excessiveEdges: [],
		expectedScore: 1.0,
	},
	{
		studentEmail: "suzuki@kitbuild.mail",
		attempt: 1,
		correctEdgeIds: [
			"e1",
			"e2",
			"e3",
			"e4",
			"e5",
			"e6",
			"e7",
			"e8",
			"e9",
			"e10",
			"e11",
			"e12",
			"e13",
		],
		excessiveEdges: [],
		expectedScore: 0.93,
	},
	{
		studentEmail: "yamamoto@kitbuild.mail",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
		excessiveEdges: [],
		expectedScore: 0.79,
	},
	{
		studentEmail: "watanabe@kitbuild.mail",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
		excessiveEdges: [{ source: "uchi", target: "suupaa" }],
		expectedScore: 0.71,
	},
	{
		studentEmail: "takahashi@kitbuild.mail",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
		excessiveEdges: [{ source: "yuubinkyoku", target: "hanaya" }],
		expectedScore: 0.57,
	},
	{
		studentEmail: "takahashi@kitbuild.mail",
		attempt: 2,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"],
		excessiveEdges: [],
		expectedScore: 0.86,
	},
];
