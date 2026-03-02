export const TAM_QUESTIONS = [
	{
		questionText: "Using Kit-Build improves my reading comprehension skills.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Kit-Build is helpful for understanding the structure and relationships within a text.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Using Kit-Build makes it easier to organize information from what I have read.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "I think using Kit-Build is more effective for learning Japanese reading than traditional methods.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Kit-Build is useful for my Japanese language learning.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "I found Kit-Build easy to use.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "The Kit-Build interface is clear and easy to understand.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "I was able to learn how to use Kit-Build quickly.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Connecting concepts in Kit-Build is intuitive.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Using Kit-Build did not require much mental effort.",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
];

export const FEEDBACK_QUESTIONS = [
	{
		questionText: "キットビルドを使ってみて、最も良かった点は何ですか？",
		type: "text" as const,
		options: [],
	},
	{
		questionText: "キットビルドを使っている時に、どのような困難（難しさ）を感じましたか？",
		type: "text" as const,
		options: [],
	},
	{
		questionText: "このアプリケーションを改善するための提案があれば教えてください。",
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

export interface ReadingQuestion {
	questionText: string;
	options: [string, string, string, string];
	correctAnswer: number;
	bloomLevel: BloomLevel;
	targetInfo: string;
}

export const READING_COMPREHENSION_QUESTIONS: ReadingQuestion[] = [
	{
		questionText: "田中さんは平日の朝、何時に起きますか？",
		options: ["午前6時", "午前7時", "午前8時", "午前9時"],
		correctAnswer: 0,
		bloomLevel: "L1-Remembering",
		targetInfo: "まいにちあさ６じにおきます",
	},
	{
		questionText: "田中さんは学校で何時間勉強しますか？",
		options: ["2時間", "3時間", "4時間", "5時間"],
		correctAnswer: 2,
		bloomLevel: "L1-Remembering",
		targetInfo: "４じかんべんきょうします",
	},
	{
		questionText: "田中さんは平日の昼休み、どこで昼ごはんを食べますか？",
		options: ["家", "学校の学食（きっさてん）", "レストラン", "図書館"],
		correctAnswer: 1,
		bloomLevel: "L1-Remembering",
		targetInfo: "がっこうのきっさてんでたべます",
	},
	{
		questionText: "田中さんは通常、夜何時ごろに寝ますか？",
		options: ["午後9時", "午後10時", "午後11時", "午前0時"],
		correctAnswer: 2,
		bloomLevel: "L1-Remembering",
		targetInfo: "よる１１じごろねます",
	},
	{
		questionText: "田中さんは朝ごはんを食べた後、何をしますか？",
		options: [
			"ゲームをする",
			"電車で学校に行く",
			"図書館で勉強する",
			"友達に会う",
		],
		correctAnswer: 1,
		bloomLevel: "L2-Understanding",
		targetInfo: "あさごはんをたべたあと、でんしゃでがっこうにいきます",
	},
	{
		questionText: "田中さんは午後の学校で何をしますか？",
		options: [
			"授業で勉強するだけ",
			"友達と話したり、図書館で本を読んだりする",
			"アルバイトをする",
			"買い物に行く",
		],
		correctAnswer: 1,
		bloomLevel: "L2-Understanding",
		targetInfo: "ともだちとはなしたり、としょかんでほんをよんだりします",
	},
	{
		questionText: "田中さんの週末は平日とどのように違いますか？",
		options: [
			"もっと長時間勉強する",
			"もっと遅く起きて、アルバイトをする",
			"もっと早く学校に行く",
			"学校で朝ごはんを食べる",
		],
		correctAnswer: 1,
		bloomLevel: "L2-Understanding",
		targetInfo: "どようびのあさは９じごろまでねます。アルバイトをします",
	},
	{
		questionText: "田中さんはどこで晩ごはんを食べますか？",
		options: [
			"学校",
			"一人でレストラン",
			"家で家族と一緒に",
			"友達の家",
		],
		correctAnswer: 2,
		bloomLevel: "L2-Understanding",
		targetInfo: "ばんごはんはいつもうちでかぞくといっしょにたべます",
	},
	{
		questionText: "もし田中さんの朝の授業が午前8時に始まる場合、どのような問題が考えられますか？",
		options: [
			"彼は午前6時に起きる",
			"通常は午前6時に起きるが、土曜日は午前9時に起きる",
			"学校が家から遠い",
			"朝ごはんを食べない",
		],
		correctAnswer: 1,
		bloomLevel: "L3-Applying",
		targetInfo: "Apply weekday schedule to hypothetical scenario",
	},
	{
		questionText: "田中さんの友達が土曜日の朝に映画に誘いました。田中さんが誘いを受けるにはどうすればいいですか？",
		options: [
			"いつもより早く起きる",
			"朝ごはんを抜く",
			"アルバイトの後に行く",
			"日曜日に変更してもらう",
		],
		correctAnswer: 0,
		bloomLevel: "L3-Applying",
		targetInfo: "どようびのあさは９じごろまでねます - needs to wake up earlier",
	},
	{
		questionText: "本文に基づくと、田中さんが火曜日の午後7時にいない可能性が高い場所はどこですか？",
		options: [
			"図書館",
			"家（晩ごはんを食べている）",
			"友達の家",
			"レストランで勉強している",
		],
		correctAnswer: 1,
		bloomLevel: "L3-Applying",
		targetInfo: "ばんごはんはいつもうちで - implies home for dinner, not out",
	},
	{
		questionText: "新しい学生が田中さんのように勉強したいと考えています。平日はどのようなスケジュールに従うべきですか？",
		options: [
			"9時に起き、学食で食べ、10時に寝る",
			"6時に起き、家で食べ、4時間勉強し、11時に寝る",
			"7時に起き、朝ごはんを抜き、2時間勉強し、12時に寝る",
			"8時に起き、レストランで食べ、3時間勉強し、9時に寝る",
		],
		correctAnswer: 1,
		bloomLevel: "L3-Applying",
		targetInfo: "Apply Tanaka's routine to new student",
	},
	{
		questionText: "なぜ田中さんは午後に図書館で勉強するのでしょうか？",
		options: [
			"授業が終わり、友達が忙しいため",
			"4時間の授業を終えて、本を読みたいから",
			"学食が閉まっているため",
			"家に本を忘れたため",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Connect Class finished -> Library reading",
	},
	{
		questionText: "田中さんの朝のルーチンと夜のルーチンの関係は何ですか？",
		options: [
			"それらは正反対である",
			"朝は早く始まり（6時）、夜は遅く終わる（11時）ことから、長い一日であることを示している",
			"それらは同時に起こる",
			"関係はない",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze connection between early wake and late sleep",
	},
	{
		questionText: "本文から、田中さんのアルバイトについて何が推測できますか？",
		options: [
			"毎日働いている",
			"土曜日の午前中に寝た後、午後から働いている",
			"日曜日の朝に働いている",
			"仕事をしていない",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Connect Saturday wake time -> Part-time schedule inference",
	},
	{
		questionText: "田中さんの週末の朝はなぜ違うのでしょうか？",
		options: [
			"学校があるから早く起きる",
			"学校に行く必要がないから遅く起きる",
			"常に同じ時間に起きる",
			"週末は朝ごはんを抜く",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze cause: No school -> Sleep until 9AM",
	},
	{
		questionText: "田中さんの日常生活を最もよく表している文はどれですか？",
		options: [
			"彼は怠惰で寝すぎである",
			"彼は勉強、仕事、余暇の時間のバランスが取れたルーチンを持っている",
			"彼は勉強ばかりして、決して楽しまない",
			"彼は働きすぎて、決して休まない",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate overall balance of Tanaka's lifestyle",
	},
	{
		questionText: "田中さんの土曜日のルーチンは学生にとって効果的ですか？なぜですか？",
		options: [
			"いいえ、働く代わりに、もっと勉強すべきだから",
			"はい、休み、働き、勉強し、さらに日曜日には楽しむ時間があるから",
			"いいえ、起きるのが遅すぎるから",
			"はい、一日中勉強しているから",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate Saturday balance: Rest, Work, Study, Play",
	},
	{
		questionText: "田中さんがこのライフスタイルを維持するために最も重要な要素は何だと考えられますか？",
		options: [
			"高価な食事をとること",
			"勉強、仕事、休息の間の適切な時間管理",
			"多くの友達がいること",
			"学校の近くに住むこと",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate key requirement: Time management",
	},
	{
		questionText: "最後の文に基づくと、田中さんは自分のライフスタイルについてどのように感じていると思われますか？",
		options: [
			"疲れていて変えたいと思っている",
			"忙しいが満足している",
			"自分のルーチンに飽きている",
			"もっと働きたいと思っている",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "たのしいです - evaluate sentiment despite いそがしい",
	},
	{
		questionText: "もし田中さんに新しい恋人ができた場合、スケジュールの変更として最も可能性が高いのはどれですか？",
		options: [
			"学校に行くのをやめる",
			"日曜日の活動を調整して、パートナーと過ごす時間を作る",
			"朝ごはんを食べるのをやめる",
			"土曜日の労働時間を増やす",
		],
		correctAnswer: 1,
		bloomLevel: "L6-Creating",
		targetInfo: "Synthesize: Sunday is free time -> Can adjust for social life",
	},
	{
		questionText: "田中さんの活動の週間サマリーを作成してください。どのようなパターンが見られますか？",
		options: [
			"彼はパターンのないランダムな活動をしている",
			"平日：構造化された学校のスケジュール。週末：仕事、勉強、社交時間を伴う柔軟なスケジュール",
			"彼は一週間毎日働いている",
			"彼は平日のみ勉強している",
		],
		correctAnswer: 1,
		bloomLevel: "L6-Creating",
		targetInfo: "Synthesize weekday structure vs weekend flexibility pattern",
	},
];
