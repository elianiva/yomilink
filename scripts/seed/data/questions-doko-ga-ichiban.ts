const LIKERT_SCALE_5 = {
	type: "likert" as const,
	scaleSize: 5,
	labels: {
		"1": "Strongly Disagree",
		"2": "Disagree",
		"3": "Neutral",
		"4": "Agree",
		"5": "Strongly Agree",
	},
};

export const TAM_QUESTIONS = [
	{
		questionText: "Using Kit-Build improves my reading comprehension",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Kit-Build helps me understand the structure and relationships in the text",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Kit-Build makes it easier for me to organize information from the reading",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText:
			"Using Kit-Build helps me learn Japanese reading better than traditional methods",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "I find Kit-Build useful for my Japanese language learning",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "I found Kit-Build easy to use",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "The interface of Kit-Build is clear and understandable",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Learning to use Kit-Build was quick and easy",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Connecting concepts in Kit-Build is intuitive",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "My interaction with Kit-Build does not require a lot of mental effort.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
];

export const FEEDBACK_QUESTIONS = [
	{
		questionText: "What did you like most about using Kit-Build?",
		type: "text" as const,
		options: [],
	},
	{
		questionText: "What difficulties did you encounter while using Kit-Build?",
		type: "text" as const,
		options: [],
	},
	{
		questionText: "What improvements would you suggest for the application?",
		type: "text" as const,
		options: [],
	},
];

export type BloomLevel =
	| "L1-Remembering"
	| "L2-Understanding"
	| "L3-Applying"
	| "L4-Analyzing"
	| "L5-Evaluating"
	| "L6-Creating";

export interface McqOption {
	id: string;
	text: string;
}

export interface ReadingQuestion {
	questionText: string;
	options: McqOption[];
	correctOptionId: string;
	bloomLevel: BloomLevel;
	targetInfo: string;
}

function generateOptionId(questionIndex: number, optionIndex: number): string {
	return "q" + String(questionIndex) + "_opt" + String(optionIndex);
}

function createMcqOptions(
	questionIndex: number,
	optionTexts: [string, string, string, string],
): McqOption[] {
	return optionTexts.map((text, idx) => ({
		id: generateOptionId(questionIndex, idx),
		text,
	}));
}

export const READING_COMPREHENSION_QUESTIONS: ReadingQuestion[] = [
	// L1-Remembering (Recall facts)
	{
		questionText: "わたしの うちの 近くに スーパーが いくつ ありますか？",
		options: createMcqOptions(0, ["3つ", "2つ", "4つ", "5つ"]),
		correctOptionId: generateOptionId(0, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the number of supermarkets near the house",
	},
	{
		questionText: "3つの スーパーの 名前は何ですか？",
		options: createMcqOptions(1, [
			"毎日屋、ABCストア、ジャパン",
			"毎日屋、スーパー、パン屋",
			"ABCストア、ジャパン、魚屋",
			"毎日屋、肉屋、野菜屋",
		]),
		correctOptionId: generateOptionId(1, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the names of the three supermarkets",
	},
	{
		questionText: "「毎日屋」まで歩いて何分 かかりますか？",
		options: createMcqOptions(2, ["5分", "10分", "15分", "20分"]),
		correctOptionId: generateOptionId(2, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the walking time to Mainichiya",
	},
	{
		questionText: "「ABCストア」まで歩いて何分 かかりますか？",
		options: createMcqOptions(3, ["5分", "10分", "15分", "20分"]),
		correctOptionId: generateOptionId(3, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the walking time to ABC Store",
	},
	{
		questionText: "「毎日屋」に多いものは何ですか？",
		options: createMcqOptions(4, ["魚と野菜と果物", "肉とパン", "外国の物", "魚と肉"]),
		correctOptionId: generateOptionId(4, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall what Mainichiya has a lot of",
	},

	// L2-Understanding (Explain ideas)
	{
		questionText: "「毎日屋」は どんな 店ですか？",
		options: createMcqOptions(5, [
			"小さいが近い",
			"大きいが遠い",
			"安いが小さい",
			"大きいが安い",
		]),
		correctOptionId: generateOptionId(5, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand the characteristics of Mainichiya",
	},
	{
		questionText: "「ABCストア」の 特徴は何ですか？",
		options: createMcqOptions(6, [
			"いちばん 安い",
			"いちばん 近い",
			"いちばん 大きい",
			"いちばん 魚が多い",
		]),
		correctOptionId: generateOptionId(6, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand the characteristic of ABC Store",
	},
	{
		questionText: "「ジャパン」に 特にあるものは何ですか？",
		options: createMcqOptions(7, ["外国の物", "魚", "野菜", "果物"]),
		correctOptionId: generateOptionId(7, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand what Japan has especially",
	},
	{
		questionText: "「毎日屋」に 外国の 物は ありますか？",
		options: createMcqOptions(8, [
			"全然 ありません",
			"たくさん あります",
			"少し あります",
			"いちばん 多いです",
		]),
		correctOptionId: generateOptionId(8, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand that Mainichiya has no foreign products",
	},

	// L3-Applying (Use information in new situations)
	{
		questionText: "魚を 買いたいとき、どこへ 行きますか？",
		options: createMcqOptions(9, ["毎日屋", "ABCストア", "ジャパン", "パン屋"]),
		correctOptionId: generateOptionId(9, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to buying fish",
	},
	{
		questionText: "安くて 大きい 店が 欲しいとき、どこへ 行きますか？",
		options: createMcqOptions(10, ["ABCストア", "毎日屋", "ジャパン", "近所の店"]),
		correctOptionId: generateOptionId(10, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to finding a cheap large store",
	},
	{
		questionText: "外国の 物を 買いたいとき、どこが いちばん いいですか？",
		options: createMcqOptions(11, ["ジャパン", "毎日屋", "ABCストア", "どこも いい"]),
		correctOptionId: generateOptionId(11, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to buying foreign products",
	},
	{
		questionText: "早く 買い物を したいとき、どこへ 行きますか？",
		options: createMcqOptions(12, ["毎日屋", "ABCストア", "ジャパン", "どこも 同じ"]),
		correctOptionId: generateOptionId(12, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to quick shopping",
	},

	// L4-Analyzing (Compare and contrast)
	{
		questionText: "3つの 店の 中で、いちばん 小さい 店はどこですか？",
		options: createMcqOptions(13, ["毎日屋", "ABCストア", "ジャパン", "全部 同じ"]),
		correctOptionId: generateOptionId(13, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze and identify the smallest store",
	},
	{
		questionText: "3つの 店の 中で、いちばん 遠い 店はどこですか？",
		options: createMcqOptions(14, ["ジャパン", "毎日屋", "ABCストア", "全部 同じ"]),
		correctOptionId: generateOptionId(14, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze and identify the farthest store",
	},
	{
		questionText: "「ABCストア」と「ジャパン」の 共通点は何ですか？",
		options: createMcqOptions(15, ["肉が多い", "近い", "小さい", "魚が多い"]),
		correctOptionId: generateOptionId(15, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze the common feature between ABC Store and Japan",
	},
	{
		questionText: "「毎日屋」と「ジャパン」の 違いは 何ですか？",
		options: createMcqOptions(16, [
			"毎日屋は近くて、ジャパンは遠い",
			"毎日屋は大きい",
			"ジャパンは安い",
			"毎日屋に外国の物が多い",
		]),
		correctOptionId: generateOptionId(16, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze the difference between Mainichiya and Japan",
	},

	// L5-Evaluating (Make judgments)
	{
		questionText: "この 中で、いちばん いい スーパーはどこですか？",
		options: createMcqOptions(17, ["ABCストア", "毎日屋", "ジャパン", "全部 同じ"]),
		correctOptionId: generateOptionId(17, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the best supermarket based on passage",
	},
	{
		questionText: "「毎日屋」の メリットは 何ですか？",
		options: createMcqOptions(18, ["近くて新鮮な魚がある", "安い", "大きい", "外国の物が多い"]),
		correctOptionId: generateOptionId(18, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the advantages of Mainichiya",
	},

	// L6-Creating (Synthesize information)
	{
		questionText: "3つの 店を 比べて、まとめると どうなりますか？",
		options: createMcqOptions(19, [
			"毎日屋は小さくて近い、ABCストアは安くて肉が多い、ジャパンは大きくて外国の物が多い",
			"全部 同じです",
			"毎日屋がいちばん大きい",
			"ジャパンがいちばん安い",
		]),
		correctOptionId: generateOptionId(19, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a comprehensive summary of all three stores",
	},
	{
		questionText: "この 話を 読んで、地図を 作ります。地図の 中心は どこですか？",
		options: createMcqOptions(20, ["わたしのうち", "毎日屋", "ABCストア", "ジャパン"]),
		correctOptionId: generateOptionId(20, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a structural representation with the correct central element",
	},
	{
		questionText: "友達に「どこへ 行けばいい？」と 聞かれたら、何と 答えますか？",
		options: createMcqOptions(21, [
			"何を 買いたいかによって 違います",
			"毎日屋へ 行ってください",
			"ABCストアへ 行ってください",
			"ジャパンへ 行ってください",
		]),
		correctOptionId: generateOptionId(21, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a synthesized recommendation based on context",
	},
];

export const QUESTION_CORRECT_ANSWERS: Record<number, string> =
	READING_COMPREHENSION_QUESTIONS.reduce(
		(acc, q, idx) => {
			acc[idx] = q.correctOptionId;
			return acc;
		},
		{} as Record<number, string>,
	);

export const QUESTION_OPTION_IDS: Record<number, string[]> = READING_COMPREHENSION_QUESTIONS.reduce(
	(acc, q, idx) => {
		acc[idx] = q.options.map((o) => o.id);
		return acc;
	},
	{} as Record<number, string[]>,
);
