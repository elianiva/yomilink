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
		questionText: "Using Kit-Build improves my reading comprehension skills.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText:
			"Kit-Build is helpful for understanding the structure and relationships within a text.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText:
			"Using Kit-Build makes it easier to organize information from what I have read.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText:
			"I think using Kit-Build is more effective for learning Japanese reading than traditional methods.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Kit-Build is useful for my Japanese language learning.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "I found Kit-Build easy to use.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "The Kit-Build interface is clear and easy to understand.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "I was able to learn how to use Kit-Build quickly.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Connecting concepts in Kit-Build is intuitive.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
	{
		questionText: "Using Kit-Build did not require much mental effort.",
		type: "likert" as const,
		options: LIKERT_SCALE_5,
	},
];

export const FEEDBACK_QUESTIONS = [
	{
		questionText: "What was the most helpful part of using Kit-Build?",
		type: "text" as const,
		options: [],
	},
	{
		questionText: "What difficulties did you experience while using Kit-Build?",
		type: "text" as const,
		options: [],
	},
	{
		questionText: "Do you have any suggestions to improve this application?",
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
	{
		questionText: "田中さんは何ですか？",
		options: createMcqOptions(0, ["がくせい", "せんせい", "いしゃ", "しょくどうのひと"]),
		correctOptionId: generateOptionId(0, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Identify Tanaka's role",
	},
	{
		questionText: "田中さんは毎日何時におきますか？",
		options: createMcqOptions(1, ["6じ", "7じ", "8じ", "9じ"]),
		correctOptionId: generateOptionId(1, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall wake-up time",
	},
	{
		questionText: "田中さんは朝、どこへ行きますか？",
		options: createMcqOptions(2, ["がっこう", "うち", "こうえん", "えき"]),
		correctOptionId: generateOptionId(2, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall destination after breakfast",
	},
	{
		questionText: "田中さんは学校で何時間べんきょうしますか？",
		options: createMcqOptions(3, ["2時間", "3時間", "4時間", "5時間"]),
		correctOptionId: generateOptionId(3, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall study duration",
	},
	{
		questionText: "田中さんは昼ごはんをどこでたべますか？",
		options: createMcqOptions(4, ["うち", "がっこうのしょくどう", "レストラン", "としょかん"]),
		correctOptionId: generateOptionId(4, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand lunch location",
	},
	{
		questionText: "田中さんは夜何時ごろにねますか？",
		options: createMcqOptions(5, ["9じごろ", "10じごろ", "11じごろ", "12じごろ"]),
		correctOptionId: generateOptionId(5, 2),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand bedtime",
	},
	{
		questionText: "この文章は田中さんのどんな生活を表していますか？",
		options: createMcqOptions(6, ["あたらしい生活", "きそく正しい生活", "ひまな生活", "旅行の生活"]),
		correctOptionId: generateOptionId(6, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "Interpret the routine",
	},
	{
		questionText: "田中さんは毎日どんな日課を送っていますか？",
		options: createMcqOptions(7, ["ばらばらな日課", "毎日同じような日課", "あさだけの生活", "よるだけの生活"]),
		correctOptionId: generateOptionId(7, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "Summarize the routine pattern",
	},
	{
		questionText: "朝ごはんのあと、田中さんは何をしますか？",
		options: createMcqOptions(8, ["でんしゃでがっこうへいく", "うちでねる", "しょくどうでかいものする", "ともだちとあそぶ"]),
		correctOptionId: generateOptionId(8, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply sequence to morning routine",
	},
	{
		questionText: "田中さんが学校につく前に必要なことはどれですか？",
		options: createMcqOptions(9, ["6じにおきる", "11じにねる", "4じかんべんきょうする", "しょくどうでひるごはんをたべる"]),
		correctOptionId: generateOptionId(9, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply the routine before school",
	},
	{
		questionText: "『朝ごはんをたべて、でんしゃでがっこうへいきます』から、分かることはどれですか？",
		options: createMcqOptions(10, ["朝ごはんのあとに通学する", "学校のあとに朝ごはんをたべる", "毎日おそくおきる", "学校へはあるいていく"]),
		correctOptionId: generateOptionId(10, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply a direct statement to a concrete action",
	},
	{
		questionText: "田中さんの一日の正しい順番はどれですか？",
		options: createMcqOptions(11, [
			"おきる→あさごはん→がっこうへいく→べんきょう→ひるごはん→ねる",
			"あさごはん→おきる→べんきょう→がっこうへいく→ねる→ひるごはん",
			"がっこうへいく→おきる→ねる→べんきょう→あさごはん→ひるごはん",
			"ひるごはん→べんきょう→おきる→がっこうへいく→あさごはん→ねる",
		]),
		correctOptionId: generateOptionId(11, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze the order of events",
	},
	{
		questionText: "田中さんが『4じかんべんきょうする』には、どんな考え方が必要ですか？",
		options: createMcqOptions(12, ["早起きと時間管理", "あさごはんをぬくこと", "夜おそくまであそぶこと", "がっこうへ行かないこと"]),
		correctOptionId: generateOptionId(12, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze the time needed to keep the schedule",
	},
	{
		questionText: "学校で行うこととして合っているのはどれですか？",
		options: createMcqOptions(13, ["4じかんべんきょうする", "あさごはんをたべる", "6じにおきる", "よる11じにねる"]),
		correctOptionId: generateOptionId(13, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze where each action happens",
	},
	{
		questionText: "田中さんの生活の特徴として最も近いものはどれですか？",
		options: createMcqOptions(14, ["短くて、きそく正しい日課", "いつもとてもふきそく", "学校と関係がない生活", "夜だけ活動する生活"]),
		correctOptionId: generateOptionId(14, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the overall routine",
	},
	{
		questionText: "この文章から、学習にいちばん大切だと考えられるのはどれですか？",
		options: createMcqOptions(15, ["時間をうまくつかうこと", "テレビを見ること", "たくさん買い物をすること", "毎日ねる時間を変えること"]),
		correctOptionId: generateOptionId(15, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the key skill behind the routine",
	},
	{
		questionText: "田中さんの生活について、もっともよい説明はどれですか？",
		options: createMcqOptions(16, ["早起きして学校で勉強する生活", "夜ふかし中心の生活", "家にこもる生活", "旅行ばかりする生活"]),
		correctOptionId: generateOptionId(16, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the best description of the lifestyle",
	},
	{
		questionText: "この文章を一文でまとめると、どれがいちばんよいですか？",
		options: createMcqOptions(17, [
			"田中さんは毎日6じにおき、学校で4じかんべんきょうし、11じごろねる",
			"田中さんは毎日おそくおきて、学校へ行かない",
			"田中さんは昼ごはんのあとだけ勉強する",
			"田中さんは毎日しょくどうでねる",
		]),
		correctOptionId: generateOptionId(17, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Synthesize the whole passage into one sentence",
	},
	{
		questionText: "同じような朝の予定を作るなら、最初に入れるべき行動はどれですか？",
		options: createMcqOptions(18, ["6じにおきる", "4じかんべんきょうする", "11じごろねる", "しょくどうでひるごはんをたべる"]),
		correctOptionId: generateOptionId(18, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a morning schedule from the passage",
	},
	{
		questionText: "この文章をもとに新しい一日の日課を作るなら、必ず入る要素はどれですか？",
		options: createMcqOptions(19, ["早起き・通学・勉強・早寝", "夜ふかし・買い物・旅行", "朝ごはんをぬくこと", "学校へ行かないこと"]),
		correctOptionId: generateOptionId(19, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a routine that preserves the main actions",
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
	{} as Record<number, string[]>);
