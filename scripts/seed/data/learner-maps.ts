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
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
			"e11", "e12", "e13", "e14", "e15",
		],
		excessiveEdges: [],
		expectedScore: 1.0,
	},
	{
		studentEmail: "suzuki@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
			"e11", "e12", "e13", "e14",
		],
		excessiveEdges: [],
		expectedScore: 0.93,
	},
	{
		studentEmail: "yamamoto@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
			"e11", "e12",
		],
		excessiveEdges: [],
		expectedScore: 0.8,
	},
	{
		studentEmail: "watanabe@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
			"e11",
		],
		excessiveEdges: [{ source: "daily-life", target: "commute" }],
		expectedScore: 0.73,
	},
	{
		studentEmail: "takahashi@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9",
		],
		excessiveEdges: [{ source: "morning", target: "sleep" }],
		expectedScore: 0.6,
	},
	{
		studentEmail: "takahashi@demo.local",
		attempt: 2,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
			"e11", "e12", "e13",
		],
		excessiveEdges: [],
		expectedScore: 0.87,
	},
	{
		studentEmail: "ito@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
		],
		excessiveEdges: [],
		expectedScore: 0.67,
	},
	{
		studentEmail: "nakamura@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8",
		],
		excessiveEdges: [{ source: "work", target: "sleep" }],
		expectedScore: 0.53,
	},
	{
		studentEmail: "kobayashi@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6",
		],
		excessiveEdges: [
			{ source: "daily-life", target: "sleep" },
			{ source: "morning", target: "free-time" },
		],
		expectedScore: 0.4,
	},
	{
		studentEmail: "kato@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10",
			"e11",
		],
		excessiveEdges: [],
		expectedScore: 0.73,
	},
	{
		studentEmail: "matsumoto@demo.local",
		attempt: 1,
		correctEdgeIds: [
			"e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e13",
			"e14", "e15",
		],
		excessiveEdges: [],
		expectedScore: 0.8,
	},
];
