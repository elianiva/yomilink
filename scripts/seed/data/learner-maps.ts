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
		],
		excessiveEdges: [],
		expectedScore: 1.0,
	},
];
