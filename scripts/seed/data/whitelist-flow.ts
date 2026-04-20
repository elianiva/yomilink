export const WHITELIST_FLOW_ACCOUNTS = [
	{
		studentId: "20260001",
		name: "Tanaka Hanako",
		email: "20260001@yomilink.local",
		password: "password123",
		age: 20,
		jlptLevel: "N5" as const,
		japaneseLearningDuration: 12,
		previousJapaneseScore: 75,
		mediaConsumption: 15,
		motivation: "Anime and Japanese culture",
	},
	{
		studentId: "20260002",
		name: "Suzuki Ken",
		email: "20260002@yomilink.local",
		password: "password123",
		age: 19,
		jlptLevel: "N5" as const,
		japaneseLearningDuration: 8,
		previousJapaneseScore: 68,
		mediaConsumption: 20,
		motivation: "Want to study in Japan",
	},
	{
		studentId: "20260003",
		name: "Sato Yui",
		email: "20260003@yomilink.local",
		password: "password123",
		age: 21,
		jlptLevel: "N5" as const,
		japaneseLearningDuration: 18,
		previousJapaneseScore: 82,
		mediaConsumption: 10,
		motivation: "Career opportunities",
	},
	{
		studentId: "20260004",
		name: "Yamada Haru",
		email: "20260004@yomilink.local",
		password: "authpassword123",
		age: 20,
		jlptLevel: "N5" as const,
		japaneseLearningDuration: 10,
		previousJapaneseScore: 70,
		mediaConsumption: 25,
		motivation: "J-Pop and manga",
	},
	{
		studentId: "20260005",
		name: "Kobayashi Mei",
		email: "20260005@yomilink.local",
		password: "immediate123",
		age: 19,
		jlptLevel: "N5" as const,
		japaneseLearningDuration: 6,
		previousJapaneseScore: 65,
		mediaConsumption: 8,
		motivation: "Travel to Japan",
	},
] as const;

function scorePattern(wrongIndices: number[]) {
	const pattern = Array.from({ length: 20 }, () => 1);
	for (const index of wrongIndices) {
		if (index >= 0 && index < pattern.length) pattern[index] = 0;
	}
	return pattern;
}

const EMAIL = {
	hanako: "20260001@yomilink.local",
	ken: "20260002@yomilink.local",
	yui: "20260003@yomilink.local",
	haru: "20260004@yomilink.local",
	mei: "20260005@yomilink.local",
} as const;

export const WHITELIST_FLOW_PRETEST_SCORES: Record<string, number[]> = {
	[EMAIL.hanako]: scorePattern([4, 6, 9, 12, 15, 18]),
	[EMAIL.ken]: scorePattern([1, 3, 5, 7, 9, 11, 13, 15]),
	[EMAIL.yui]: scorePattern([0, 2, 4, 6, 8, 10, 12, 14, 16]),
	[EMAIL.haru]: scorePattern([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
	[EMAIL.mei]: scorePattern([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
};

export const WHITELIST_FLOW_POSTTEST_SCORES: Record<string, number[]> = {
	[EMAIL.hanako]: scorePattern([12, 18]),
	[EMAIL.ken]: scorePattern([7, 13, 17]),
	[EMAIL.yui]: scorePattern([3, 7, 11, 15, 19]),
	[EMAIL.haru]: scorePattern([2, 5, 8, 11, 14, 17]),
	[EMAIL.mei]: scorePattern([2, 5, 8, 11, 14]),
};

export const WHITELIST_FLOW_DELAYEDTEST_SCORES: Record<string, number[]> = {
	[EMAIL.hanako]: scorePattern([10, 18]),
	[EMAIL.ken]: scorePattern([5, 13, 16]),
	[EMAIL.yui]: scorePattern([3, 7, 11, 19]),
	[EMAIL.haru]: scorePattern([1, 4, 7, 10, 13, 16, 19]),
	[EMAIL.mei]: scorePattern([1, 4, 7, 10, 13, 16]),
};

export const WHITELIST_FLOW_LEARNER_MAP_CONFIGS = [
	{
		studentEmail: EMAIL.hanako,
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
			"e15",
		],
		excessiveEdges: [],
		expectedScore: 1,
	},
	{
		studentEmail: EMAIL.ken,
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
		expectedScore: 0.93,
	},
	{
		studentEmail: EMAIL.yui,
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11", "e12"],
		excessiveEdges: [],
		expectedScore: 0.8,
	},
	{
		studentEmail: EMAIL.haru,
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8", "e9", "e10", "e11"],
		excessiveEdges: [{ source: "tanaka", target: "sleep" }],
		expectedScore: 0.73,
	},
	{
		studentEmail: EMAIL.mei,
		attempt: 1,
		correctEdgeIds: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"],
		excessiveEdges: [{ source: "morning", target: "sleep" }],
		expectedScore: 0.53,
	},
] as const;
