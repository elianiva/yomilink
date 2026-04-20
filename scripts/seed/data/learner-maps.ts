export interface LearnerMapConfig {
	studentEmail: string;
	attempt: number;
	correctEdgeIds: string[];
	excessiveEdges: Array<{ source: string; target: string }>;
	expectedScore: number;
}

export const LEARNER_MAP_CONFIGS: LearnerMapConfig[] = [
	{
		studentEmail: "tanaka@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13"],
		excessiveEdges: [],
		expectedScore: 1.0,
	},
	{
		studentEmail: "suzuki@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"],
		excessiveEdges: [],
		expectedScore: 0.92,
	},
	{
		studentEmail: "yamamoto@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
		excessiveEdges: [],
		expectedScore: 0.77,
	},
	{
		studentEmail: "watanabe@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9"],
		excessiveEdges: [{ source: "tanaka", target: "sleep" }],
		expectedScore: 0.69,
	},
	{
		studentEmail: "takahashi@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
		excessiveEdges: [{ source: "morning", target: "sleep" }],
		expectedScore: 0.62,
	},
	{
		studentEmail: "takahashi@demo.local",
		attempt: 2,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
		excessiveEdges: [],
		expectedScore: 0.85,
	},
	{
		studentEmail: "ito@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9"],
		excessiveEdges: [],
		expectedScore: 0.69,
	},
	{
		studentEmail: "nakamura@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7"],
		excessiveEdges: [{ source: "student", target: "sleep" }],
		expectedScore: 0.54,
	},
	{
		studentEmail: "kobayashi@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5"],
		excessiveEdges: [
			{ source: "tanaka", target: "sleep" },
			{ source: "student", target: "morning" },
		],
		expectedScore: 0.38,
	},
	{
		studentEmail: "kato@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
		excessiveEdges: [],
		expectedScore: 0.77,
	},
	{
		studentEmail: "matsumoto@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
		excessiveEdges: [],
		expectedScore: 0.85,
	},
];
