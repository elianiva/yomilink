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
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13", "e14"],
		excessiveEdges: [],
		expectedScore: 1.0,
	},
	{
		studentEmail: "suzuki@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12", "e13"],
		excessiveEdges: [],
		expectedScore: 0.93,
	},
	{
		studentEmail: "yamamoto@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
		excessiveEdges: [],
		expectedScore: 0.79,
	},
	{
		studentEmail: "watanabe@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
		excessiveEdges: [{ source: "japan", target: "tokyo" }],
		expectedScore: 0.71,
	},
	{
		studentEmail: "takahashi@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
		excessiveEdges: [{ source: "kyushu", target: "tokyo" }],
		expectedScore: 0.57,
	},
	{
		studentEmail: "takahashi@demo.local",
		attempt: 2,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"],
		excessiveEdges: [],
		expectedScore: 0.86,
	},
	{
		studentEmail: "ito@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10"],
		excessiveEdges: [],
		expectedScore: 0.71,
	},
	{
		studentEmail: "nakamura@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
		excessiveEdges: [{ source: "honshu", target: "sapporo" }],
		expectedScore: 0.57,
	},
	{
		studentEmail: "kobayashi@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6"],
		excessiveEdges: [
			{ source: "japan", target: "sapporo" },
			{ source: "hokkaido", target: "fukuoka" },
		],
		expectedScore: 0.43,
	},
	{
		studentEmail: "kato@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
		excessiveEdges: [],
		expectedScore: 0.79,
	},
	{
		studentEmail: "matsumoto@demo.local",
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"],
		excessiveEdges: [],
		expectedScore: 0.86,
	},
];
