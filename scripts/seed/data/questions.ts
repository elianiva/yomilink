export const TAM_QUESTIONS = [
	{
		questionText: "Using Kit-Build improves my reading comprehension",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Kit-Build helps me understand the structure and relationships in the text",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Kit-Build makes it easier for me to organize information from the reading",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Using Kit-Build helps me learn Japanese reading better than traditional methods",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "I find Kit-Build useful for my Japanese language learning",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "I found Kit-Build easy to use",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "The interface of Kit-Build is clear and understandable",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Learning to use Kit-Build was quick and easy",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "Connecting concepts in Kit-Build is intuitive",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
	},
	{
		questionText: "My interaction with Kit-Build does not require a lot of mental effort",
		type: "likert" as const,
		options: ["1", "2", "3", "4", "5"],
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

export interface ReadingQuestion {
	questionText: string;
	options: [string, string, string, string];
	correctAnswer: number;
	bloomLevel: BloomLevel;
	targetInfo: string;
}

export const READING_COMPREHENSION_QUESTIONS: ReadingQuestion[] = [
	{
		questionText: "What time does Tanaka wake up on weekdays?",
		options: ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM"],
		correctAnswer: 0,
		bloomLevel: "L1-Remembering",
		targetInfo: "まいにちあさ６じにおきます",
	},
	{
		questionText: "How many hours does Tanaka study at school?",
		options: ["2 hours", "3 hours", "4 hours", "5 hours"],
		correctAnswer: 2,
		bloomLevel: "L1-Remembering",
		targetInfo: "４じかんべんきょうします",
	},
	{
		questionText: "Where does Tanaka eat lunch on weekdays?",
		options: ["At home", "At school cafeteria", "At a restaurant", "At the library"],
		correctAnswer: 1,
		bloomLevel: "L1-Remembering",
		targetInfo: "がっこうのきっさてんでたべます",
	},
	{
		questionText: "What time does Tanaka usually go to bed?",
		options: ["9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"],
		correctAnswer: 2,
		bloomLevel: "L1-Remembering",
		targetInfo: "よる１１じごろねます",
	},
	{
		questionText: "What does Tanaka do after eating breakfast?",
		options: [
			"Plays games",
			"Goes to school by train",
			"Studies at the library",
			"Meets friends",
		],
		correctAnswer: 1,
		bloomLevel: "L2-Understanding",
		targetInfo: "あさごはんをたべたあと、でんしゃでがっこうにいきます",
	},
	{
		questionText: "What does Tanaka do in the afternoon at school?",
		options: [
			"Only studies in class",
			"Talks with friends and reads books at the library",
			"Works part-time",
			"Goes shopping",
		],
		correctAnswer: 1,
		bloomLevel: "L2-Understanding",
		targetInfo: "ともだちとはなしたり、としょかんでほんをよんだりします",
	},
	{
		questionText: "How is Tanaka's weekend different from weekdays?",
		options: [
			"Studies more hours",
			"Wakes up later and works part-time",
			"Goes to school earlier",
			"Eats breakfast at school",
		],
		correctAnswer: 1,
		bloomLevel: "L2-Understanding",
		targetInfo: "どようびのあさは９じごろまでねます。アルバイトをします",
	},
	{
		questionText: "Where does Tanaka eat dinner?",
		options: [
			"At school",
			"At a restaurant alone",
			"At home with family",
			"At a friend's house",
		],
		correctAnswer: 2,
		bloomLevel: "L2-Understanding",
		targetInfo: "ばんごはんはいつもうちでかぞくといっしょにたべます",
	},
	{
		questionText: "If Tanaka has a morning class at 8:00 AM, what might be a problem?",
		options: [
			"He wakes up at 6:00 AM",
			"He usually wakes up at 6:00 AM but Saturday he wakes up at 9:00 AM",
			"His school is far from home",
			"He doesn't eat breakfast",
		],
		correctAnswer: 1,
		bloomLevel: "L3-Applying",
		targetInfo: "Apply weekday schedule to hypothetical scenario",
	},
	{
		questionText: "Tanaka's friend invites him to a movie on Saturday morning. What should Tanaka do to accept?",
		options: [
			"Wake up earlier than usual",
			"Skip breakfast",
			"Go after his part-time job",
			"Ask to change to Sunday",
		],
		correctAnswer: 0,
		bloomLevel: "L3-Applying",
		targetInfo: "どようびのあさは９じごろまでねます - needs to wake up earlier",
	},
	{
		questionText: "Based on the text, where would Tanaka likely NOT be on Tuesday at 7:00 PM?",
		options: [
			"At the library",
			"At home eating dinner",
			"At a friend's house",
			"At a restaurant studying",
		],
		correctAnswer: 1,
		bloomLevel: "L3-Applying",
		targetInfo: "ばんごはんはいつもうちで - implies home for dinner, not out",
	},
	{
		questionText: "A new student wants to study like Tanaka. What schedule should they follow on weekdays?",
		options: [
			"Wake at 9, eat at cafeteria, sleep at 10",
			"Wake at 6, eat at home, study 4 hours, sleep at 11",
			"Wake at 7, skip breakfast, study 2 hours, sleep at 12",
			"Wake at 8, eat at restaurant, study 3 hours, sleep at 9",
		],
		correctAnswer: 1,
		bloomLevel: "L3-Applying",
		targetInfo: "Apply Tanaka's routine to new student",
	},
	{
		questionText: "Why might Tanaka study at the library in the afternoon?",
		options: [
			"Classes are finished and his friends are busy",
			"He has finished his 4 hours of class and wants to read",
			"The cafeteria is closed",
			"He forgot his books at home",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Connect Class finished -> Library reading",
	},
	{
		questionText: "What is the relationship between Tanaka's morning routine and evening routine?",
		options: [
			"They are opposites",
			"Morning starts early (6AM), evening ends late (11PM), showing a long day",
			"They happen at the same time",
			"There is no relationship",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze connection between early wake and late sleep",
	},
	{
		questionText: "What can you infer about Tanaka's part-time job from the text?",
		options: [
			"He works every day",
			"He works only on Saturday afternoons after sleeping in",
			"He works on Sunday mornings",
			"He doesn't have a job",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Connect Saturday wake time -> Part-time schedule inference",
	},
	{
		questionText: "How does Tanaka's weekend morning differ and why?",
		options: [
			"He wakes earlier because he has school",
			"He wakes later because he doesn't have to go to school",
			"He wakes at the same time always",
			"He skips breakfast on weekends",
		],
		correctAnswer: 1,
		bloomLevel: "L4-Analyzing",
		targetInfo: "Analyze cause: No school -> Sleep until 9AM",
	},
	{
		questionText: "Which statement best describes Tanaka's daily life?",
		options: [
			"He is lazy and sleeps too much",
			"He has a balanced routine with study, work, and leisure times",
			"He only studies and never has fun",
			"He works too much and never rests",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate overall balance of Tanaka's lifestyle",
	},
	{
		questionText: "Is Tanaka's Saturday routine effective for a student? Why?",
		options: [
			"No, because he should study more instead of working",
			"Yes, because he rests, works, studies, and still has fun on Sunday",
			"No, because he wakes up too late",
			"Yes, because he studies all day",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate Saturday balance: Rest, Work, Study, Play",
	},
	{
		questionText: "What would be the most important factor for Tanaka to maintain this lifestyle?",
		options: [
			"Having expensive meals",
			"Good time management between study, work, and rest",
			"Having many friends",
			"Living close to school",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "Evaluate key requirement: Time management",
	},
	{
		questionText: "How does Tanaka likely feel about his lifestyle based on the last sentence?",
		options: [
			"He is tired and wants to change",
			"He is satisfied despite being busy",
			"He is bored with his routine",
			"He wants to work more",
		],
		correctAnswer: 1,
		bloomLevel: "L5-Evaluating",
		targetInfo: "たのしいです - evaluate sentiment despite いそがしい",
	},
	{
		questionText: "If Tanaka gets a new girlfriend/boyfriend, what schedule change would be most likely?",
		options: [
			"Stop going to school",
			"Adjust Sunday activities to include time with partner",
			"Stop eating breakfast",
			"Work more hours on Saturday",
		],
		correctAnswer: 1,
		bloomLevel: "L6-Creating",
		targetInfo: "Synthesize: Sunday is free time -> Can adjust for social life",
	},
	{
		questionText: "Create a weekly summary for Tanaka's activities. What pattern emerges?",
		options: [
			"He does random activities with no pattern",
			"Weekdays: structured school schedule. Weekends: flexible with work, study, and social time",
			"He works every day of the week",
			"He studies only on weekdays",
		],
		correctAnswer: 1,
		bloomLevel: "L6-Creating",
		targetInfo: "Synthesize weekday structure vs weekend flexibility pattern",
	},
];
