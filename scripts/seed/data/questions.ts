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
	{
		questionText: "うちの隣（となり）に何（なに）がありますか。",
		options: createMcqOptions(0, [
			"公園（こうえん）",
			"学校（がっこう）",
			"病院（びょういん）",
			"駅（えき）",
		]),
		correctOptionId: generateOptionId(0, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: kouen next to uchi",
	},
	{
		questionText: "公園（こうえん）の前（まえ）に何（なに）がありますか。",
		options: createMcqOptions(1, [
			"図書館（としょかん）と喫茶店（きっさてん）",
			"郵便局（ゆうびんきょく）と銀行（ぎんこう）",
			"花屋（はなや）とパン屋（ぱんや）",
			"スーパー",
		]),
		correctOptionId: generateOptionId(1, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: toshokan and kissaten in front of kouen",
	},
	{
		questionText: "うちの近（ちか）くに何（なに）がありますか。",
		options: createMcqOptions(2, [
			"郵便局（ゆうびんきょく）と銀行（ぎんこう）",
			"公園（こうえん）と図書館（としょかん）",
			"喫茶店（きっさてん）とパン屋（ぱんや）",
			"花屋（はなや）",
		]),
		correctOptionId: generateOptionId(2, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: yuubinkyoku and ginkou near uchi",
	},
	{
		questionText: "スーパーはどこにありますか。",
		options: createMcqOptions(3, [
			"郵便局（ゆうびんきょく）と銀行（ぎんこう）の間（あいだ）",
			"公園（こうえん）の前（まえ）",
			"うちの隣（となり）",
			"花屋（はなや）の中（なか）",
		]),
		correctOptionId: generateOptionId(3, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: suupaa between yuubinkyoku and ginkou",
	},
	{
		questionText: "スーパーの中（なか）に何（なに）がありますか。",
		options: createMcqOptions(4, [
			"花屋（はなや）とパン屋（ぱんや）",
			"図書館（としょかん）と喫茶店（きっさてん）",
			"郵便局（ゆうびんきょく）と銀行（ぎんこう）",
			"公園（こうえん）",
		]),
		correctOptionId: generateOptionId(4, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: hanaya and panya inside suupaa",
	},
	{
		questionText: "本（ほん）を借（か）りるとき、どこへ行（い）きますか。",
		options: createMcqOptions(5, [
			"図書館（としょかん）",
			"喫茶店（きっさてん）",
			"公園（こうえん）",
			"スーパー",
		]),
		correctOptionId: generateOptionId(5, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: toshokan for borrowing books",
	},
	{
		questionText: "コーヒーはどこで飲（の）みますか。",
		options: createMcqOptions(6, [
			"喫茶店（きっさてん）",
			"図書館（としょかん）",
			"郵便局（ゆうびんきょく）",
			"銀行（ぎんこう）",
		]),
		correctOptionId: generateOptionId(6, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: kissaten for coffee",
	},
	{
		questionText: "パン屋（ぱんや）はどこにありますか。",
		options: createMcqOptions(7, [
			"スーパーの中（なか）",
			"公園（こうえん）の前（まえ）",
			"うちの隣（となり）",
			"郵便局（ゆうびんきょく）の前（まえ）",
		]),
		correctOptionId: generateOptionId(7, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: panya inside suupaa",
	},
	{
		questionText: "花屋（はなや）はどこにありますか。",
		options: createMcqOptions(8, [
			"スーパーの中（なか）",
			"公園（こうえん）の前（まえ）",
			"うちの隣（となり）",
			"銀行（ぎんこう）の隣（となり）",
		]),
		correctOptionId: generateOptionId(8, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: hanaya inside suupaa",
	},
	{
		questionText: "地図（ちず）の真（ま）ん中（なか）にあるのはどこですか。",
		options: createMcqOptions(9, [
			"わたしのうち",
			"公園（こうえん）",
			"スーパー",
			"図書館（としょかん）",
		]),
		correctOptionId: generateOptionId(9, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Map node: uchi is the center of the map",
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
