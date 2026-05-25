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
	// L1-Remembering (6)
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
		targetInfo: "Triple: uchi → tonari → kouen",
	},
	{
		questionText: "公園（こうえん）の前（まえ）に何（なに）がありますか。",
		options: createMcqOptions(1, [
			"図書館（としょかん）と喫茶店（きっさてん）",
			"郵便局（ゆうびんきょく）と銀行（ぎんこう）",
			"花屋（はなや）とパン屋（ぱんや）",
			"コンビニと本屋（ほんや）",
		]),
		correctOptionId: generateOptionId(1, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Triple: kouen → mae → toshokan, kouen → mae → kissaten",
	},
	{
		questionText: "本（ほん）を借（か）りたいとき、どこへ行（い）きますか。",
		options: createMcqOptions(2, [
			"図書館（としょかん）",
			"公園（こうえん）",
			"喫茶店（きっさてん）",
			"スーパー",
		]),
		correctOptionId: generateOptionId(2, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Triple: toshokan → de → hon-kariru",
	},
	{
		questionText: "コーヒーはどこで飲（の）めますか。",
		options: createMcqOptions(3, [
			"喫茶店（きっさてん）",
			"図書館（としょかん）",
			"公園（こうえん）",
			"うち",
		]),
		correctOptionId: generateOptionId(3, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Triple: kissaten → de → coffee-nomu",
	},
	{
		questionText: "この人（ひと）のうちはどんな所（ところ）ですか。",
		options: createMcqOptions(4, [
			"静（しず）かで便利（べんり）な所（ところ）",
			"広（ひろ）くて新（あたら）しい所（ところ）",
			"古（ふる）くて静（しず）かな所（ところ）",
			"駅（えき）に近（ちか）い所（ところ）",
		]),
		correctOptionId: generateOptionId(4, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Triple: uchi → wa → benri; text: shizukana tokoro",
	},
	{
		questionText: "この人（ひと）はどこで本（ほん）を読（よ）みますか。",
		options: createMcqOptions(5, [
			"公園（こうえん）と喫茶店（きっさてん）",
			"図書館（としょかん）と公園（こうえん）",
			"喫茶店（きっさてん）と図書館（としょかん）",
			"図書館（としょかん）とうち",
		]),
		correctOptionId: generateOptionId(5, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Text: kouen de yomimasu, tokidoki kissaten de yomimasu",
	},

	// L2-Understanding (4)
	{
		questionText: "なぜこの町（まち）は便利（べんり）ですか。",
		options: createMcqOptions(6, [
			"近（ちか）くにいろいろなお店（みせ）や場所（ばしょ）があるから",
			"駅（えき）が近（ちか）いから",
			"公園（こうえん）が広（ひろ）いから",
			"新（あたら）しい建物（たてもの）が多いから",
		]),
		correctOptionId: generateOptionId(6, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Inference from multiple shops/places nearby",
	},
	{
		questionText:
			"喫茶店（きっさてん）について正（ただ）しいものはどれですか。",
		options: createMcqOptions(7, [
			"おいしいコーヒーがある",
			"本（ほん）が借（か）りられる",
			"公園（こうえん）の中（なか）にある",
			"いつも静（しず）かではない",
		]),
		correctOptionId: generateOptionId(7, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Text: kissaten no koohii wa oishii desu",
	},
	{
		questionText: "この町（まち）について正（ただ）しいものはどれですか。",
		options: createMcqOptions(8, [
			"図書館（としょかん）で借（か）りた本（ほん）を公園（こうえん）で読（よ）める",
			"うちの隣（となり）にスーパーがある",
			"図書館（としょかん）でコーヒーが飲（の）める",
			"喫茶店（きっさてん）で本（ほん）が買（か）える",
		]),
		correctOptionId: generateOptionId(8, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Synthesis of toshokan→kariru + kouen→yomu propositions",
	},
	{
		questionText: "この話（はなし）と合（あ）うものはどれですか。",
		options: createMcqOptions(9, [
			"静（しず）かで便利（べんり）な町（まち）",
			"駅（えき）の近（ちか）くの賑（にぎ）やかな町（まち）",
			"図書館（としょかん）と喫茶店（きっさてん）だけある小（ちい）さい町（まち）",
			"すべての建物（たてもの）が新（あたら）しい町（まち）",
		]),
		correctOptionId: generateOptionId(9, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Overall passage comprehension + uchi→wa→benri",
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
