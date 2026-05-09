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
		questionText: "わたしの新しいうちはどんな所にありますか？",
		options: createMcqOptions(0, ["静かな所", "にぎやかな所", "大きな所", "古い所"]),
		correctOptionId: generateOptionId(0, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the description of the home location",
	},
	{
		questionText: "うちの隣に何がありますか？",
		options: createMcqOptions(1, ["公園", "学校", "病院", "駅"]),
		correctOptionId: generateOptionId(1, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall what is next to the house",
	},
	{
		questionText: "公園の前に何がありますか？",
		options: createMcqOptions(2, [
			"図書館と喫茶店",
			"郵便局と銀行",
			"花屋とパン屋",
			"スーパーと図書館",
		]),
		correctOptionId: generateOptionId(2, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall what is in front of the park",
	},
	{
		questionText: "わたしは図書館で何をしますか？",
		options: createMcqOptions(3, [
			"本を借ります",
			"コーヒーを飲みます",
			"パンを買います",
			"花を見ます",
		]),
		correctOptionId: generateOptionId(3, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the activity at the library",
	},
	{
		questionText: "この町で一番おすすめの過ごし方はどれですか。",
		options: createMcqOptions(4, [
			"公園で本を読み、喫茶店でコーヒーを飲む",
			"図書館で本を借りて、家で読む",
			"スーパーで買い物をして、花屋で花を買う",
			"郵便局で手紙を出して、銀行でお金をおろす",
		]),
		correctOptionId: generateOptionId(4, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the best way to spend time based on the passage",
	},

	{
		questionText: "わたしはいつもどこで本を読みますか？",
		options: createMcqOptions(5, ["公園で", "図書館で", "うちで", "郵便局で"]),
		correctOptionId: generateOptionId(5, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand the usual reading location",
	},
	{
		questionText: "時々わたしはどこで本を読みますか？",
		options: createMcqOptions(6, ["喫茶店で", "銀行で", "スーパーで", "花屋で"]),
		correctOptionId: generateOptionId(6, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand the occasional reading location",
	},
	{
		questionText: "うちの近くに何がありますか？",
		options: createMcqOptions(7, [
			"郵便局と銀行",
			"公園と図書館",
			"喫茶店とパン屋",
			"図書館と銀行",
		]),
		correctOptionId: generateOptionId(7, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand what is near the house",
	},
	{
		questionText: "スーパーはどこにありますか？",
		options: createMcqOptions(8, [
			"郵便局と銀行の間に",
			"公園の前に",
			"うちの隣に",
			"花屋の中に",
		]),
		correctOptionId: generateOptionId(8, 0),
		bloomLevel: "L2-Understanding",
		targetInfo: "Understand the supermarket location",
	},

	{
		questionText: "本を借りたいとき、わたしはまずどこへ行きますか？",
		options: createMcqOptions(9, ["図書館へ", "喫茶店へ", "公園へ", "スーパーへ"]),
		correctOptionId: generateOptionId(9, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to borrowing books",
	},
	{
		questionText: "コーヒーを飲みながら本を読みたいとき、わたしはどこへ行きますか？",
		options: createMcqOptions(10, ["喫茶店へ", "図書館へ", "公園へ", "郵便局へ"]),
		correctOptionId: generateOptionId(10, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to reading with coffee",
	},
	{
		questionText: "パンを買いたいとき、わたしはどこへ行きますか？",
		options: createMcqOptions(11, ["スーパーへ", "喫茶店へ", "図書館へ", "郵便局へ"]),
		correctOptionId: generateOptionId(11, 0),
		bloomLevel: "L3-Applying",
		targetInfo: "Apply knowledge to buying bread",
	},

	{
		questionText: "公園の前にあるものは全部でいくつですか？",
		options: createMcqOptions(12, ["2つ", "1つ", "3つ", "4つ"]),
		correctOptionId: generateOptionId(12, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze the number of places in front of the park",
	},
	{
		questionText: "うちの近くにあるものとして正しいのはどれですか？",
		options: createMcqOptions(13, [
			"郵便局と銀行",
			"花屋とパン屋",
			"図書館と喫茶店",
			"スーパーだけ",
		]),
		correctOptionId: generateOptionId(13, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze what is categorized as near the house",
	},
	{
		questionText: "スーパーの中にあるものは何ですか？",
		options: createMcqOptions(14, [
			"花屋とパン屋",
			"図書館と喫茶店",
			"郵便局と銀行",
			"公園と花屋",
		]),
		correctOptionId: generateOptionId(14, 0),
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze what is inside the supermarket",
	},

	{
		questionText: "この町の店で、いちばん便利な店はどこですか。",
		options: createMcqOptions(15, ["スーパー", "花屋", "パン屋", "喫茶店"]),
		correctOptionId: generateOptionId(15, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate which shop is most convenient based on its internal offerings",
	},
	{
		questionText: "本を読むなら、どこがいいですか。",
		options: createMcqOptions(16, ["公園か喫茶店", "図書館か本屋", "うちか学校", "スーパーか郵便局"]),
		correctOptionId: generateOptionId(16, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the best reading locations based on the passage",
	},
	{
		questionText: "日曜日、友達と何をしますか。いい計画はどれですか。",
		options: createMcqOptions(17, [
			"公園で読んで、喫茶店でコーヒーを飲む",
			"スーパーで買い物して、花屋で花を買う",
			"郵便局で手紙を出して、銀行でお金をおろす",
			"図書館で借りて、うちで読む",
		]),
		correctOptionId: generateOptionId(17, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a weekend plan combining activities from the passage",
	},
	{
		questionText: "新しい友達にこの町を紹介します。どんな町ですか。",
		options: createMcqOptions(18, [
			"静かで便利な町",
			"大きいにぎやかな町",
			"古い田舎の町",
			"新しい店が多い町",
		]),
		correctOptionId: generateOptionId(18, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a synthesized description of the town based on passage details",
	},
	{
		questionText: "みんなで町の地図を作ります。地図の真ん中に何を書きますか。",
		options: createMcqOptions(19, ["わたしのうち", "公園", "図書館", "スーパー"]),
		correctOptionId: generateOptionId(19, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a map centered on the main reference point of the passage",
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
