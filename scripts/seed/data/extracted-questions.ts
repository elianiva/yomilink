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

// 20 MCQs for "わたしのうち" passage
// L1×5 | L2×4 | L3×3 | L4×3 | L5×2 | L6×3
export const READING_COMPREHENSION_QUESTIONS: ReadingQuestion[] = [
	// === L1 - Remembering (5) ===
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
		questionText: "喫茶店のコーヒーはどうですか？",
		options: createMcqOptions(4, ["おいしいです", "高いです", "苦いです", "冷たいです"]),
		correctOptionId: generateOptionId(4, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "Recall the description of the coffee",
	},

	// === L2 - Understanding (4) ===
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

	// === L3 - Applying (3) ===
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

	// === L4 - Analyzing (3) ===
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

	// === L5 - Evaluating (2) ===
	{
		questionText: "この文章から、わたしの住んでいる所の特徴はどれですか？",
		options: createMcqOptions(15, [
			"とても便利な所",
			"とても静かな所だけ",
			"とてもにぎやかな所",
			"不便な所",
		]),
		correctOptionId: generateOptionId(15, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the overall characteristic of the neighborhood",
	},
	{
		questionText: "わたしの生活について、最も近い説明はどれですか？",
		options: createMcqOptions(16, [
			"静かな所に住んで、近くにいろいろな店がある",
			"にぎやかな所に住んで、近くに何もない",
			"大きな都市に住んで、車で買い物に行く",
			"田舎に住んで、近くに友達がいない",
		]),
		correctOptionId: generateOptionId(16, 0),
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate the best description of the lifestyle",
	},

	// === L6 - Creating (3) ===
	{
		questionText: "新しい家を探すとき、この文章を参考にするなら、どれが大切ですか？",
		options: createMcqOptions(17, [
			"静かで、近くに便利な店がある所",
			"にぎやかで、レストランが多い所",
			"大きくて、高い所",
			"古くて、安い所",
		]),
		correctOptionId: generateOptionId(17, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create criteria for choosing a new home",
	},
	{
		questionText: "この文章をもとに、地図を作るなら、中心になるのはどれですか？",
		options: createMcqOptions(18, [
			"わたしのうち",
			"公園",
			"図書館",
			"スーパー",
		]),
		correctOptionId: generateOptionId(18, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a map centered on the main reference point",
	},
	{
		questionText: "週末に本を読んで、コーヒーを飲みたいときの計画として最も良いのはどれですか？",
		options: createMcqOptions(19, [
			"図書館で本を借りて、喫茶店で読む",
			"スーパーで本を借りて、公園で読む",
			"郵便局で本を借りて、銀行で読む",
			"花屋で本を借りて、パン屋で読む",
		]),
		correctOptionId: generateOptionId(19, 0),
		bloomLevel: "L6-Creating",
		targetInfo: "Create a weekend plan based on the passage",
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
