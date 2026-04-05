import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { randomString } from "@/lib/utils";
import { Database } from "@/server/db/client";
import { forms, goalMaps, questions, texts, topics } from "@/server/db/schema/app-schema";
import { cohorts } from "@/server/db/schema/auth-schema";

import { FRONTEND_QUESTIONS } from "../data/frontend-questions.js";
import { FEEDBACK_QUESTIONS, TAM_QUESTIONS } from "../data/questions.js";

const WRI_2026_COHORT = {
	name: "WRI 2026",
	description: "Writera Research Internship 2026 cohort",
};

export function seedWri2026Cohort() {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding WRI 2026 Cohort ---");

		const existing = yield* db
			.select()
			.from(cohorts)
			.where(eq(cohorts.name, WRI_2026_COHORT.name))
			.limit(1);

		let cohortId: string;
		if (existing[0]) {
			cohortId = existing[0].id;
			yield* Effect.log(`  Cohort "${WRI_2026_COHORT.name}" already exists`);
		} else {
			cohortId = randomString();
			yield* db.insert(cohorts).values({
				id: cohortId,
				name: WRI_2026_COHORT.name,
				description: WRI_2026_COHORT.description,
			});
			yield* Effect.log(`  Created cohort: ${WRI_2026_COHORT.name}`);
		}

		return { cohortId };
	});
}

export function seedWri2026Forms(teacherId: string) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding WRI 2026 Questionnaires ---");

		// TAM Form
		const tamFormTitle = "TAM Questionnaire - Kit-Build Evaluation";
		const existingTam = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, tamFormTitle))
			.limit(1);

		let tamFormId: string;
		if (existingTam[0]) {
			tamFormId = existingTam[0].id;
			yield* Effect.log(`  TAM form already exists`);
		} else {
			tamFormId = randomString();
			yield* db.insert(forms).values({
				id: tamFormId,
				title: tamFormTitle,
				description:
					"Technology Acceptance Model questionnaire to evaluate Kit-Build's Perceived Usefulness (PU) and Perceived Ease of Use (PEoU). Scale: 1=Strongly Disagree to 5=Strongly Agree",
				type: "tam",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log(`  Created TAM form`);
		}

		const existingTamQs = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, tamFormId));

		if (existingTamQs.length === 0) {
			yield* Effect.all(
				TAM_QUESTIONS.map((q, idx) =>
					db.insert(questions).values({
						id: randomString(),
						formId: tamFormId,
						type: q.type,
						questionText: q.questionText,
						options: JSON.stringify(q.options),
						orderIndex: idx,
						required: true,
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  Created ${TAM_QUESTIONS.length} TAM questions`);
		}

		// Feedback Form
		const feedbackTitle = "Feedback Questionnaire - Kit-Build Experience";
		const existingFeedback = yield* db
			.select()
			.from(forms)
			.where(eq(forms.title, feedbackTitle))
			.limit(1);

		let feedbackFormId: string;
		if (existingFeedback[0]) {
			feedbackFormId = existingFeedback[0].id;
			yield* Effect.log(`  Feedback form already exists`);
		} else {
			feedbackFormId = randomString();
			yield* db.insert(forms).values({
				id: feedbackFormId,
				title: feedbackTitle,
				description:
					"Open-ended feedback questions about the Kit-Build learning experience",
				type: "control",
				status: "published",
				createdBy: teacherId,
			});
			yield* Effect.log(`  Created feedback form`);
		}

		const existingFeedbackQs = yield* db
			.select()
			.from(questions)
			.where(eq(questions.formId, feedbackFormId));

		if (existingFeedbackQs.length === 0) {
			yield* Effect.all(
				FEEDBACK_QUESTIONS.map((q, idx) =>
					db.insert(questions).values({
						id: randomString(),
						formId: feedbackFormId,
						type: q.type,
						questionText: q.questionText,
						options: JSON.stringify(q.options),
						orderIndex: idx,
						required: false,
					}),
				),
				{ concurrency: 10 },
			);
			yield* Effect.log(`  Created ${FEEDBACK_QUESTIONS.length} feedback questions`);
		}

		// Frontend Basics Tests (Pre/Post)
		function* createTestForm(formType: "pre_test" | "post_test", title: string) {
			const existing = yield* db.select().from(forms).where(eq(forms.title, title)).limit(1);

			let formId: string;
			if (existing[0]) {
				formId = existing[0].id;
				yield* Effect.log(`  ${formType} form already exists`);
			} else {
				formId = randomString();
				yield* db.insert(forms).values({
					id: formId,
					title,
					description: `Frontend web development ${formType.replace("_", "-")}. Covers HTML structure, CSS styling, and basic JavaScript. 22 MCQ questions based on Bloom's Taxonomy.`,
					type: formType,
					status: "published",
					createdBy: teacherId,
				});
				yield* Effect.log(`  Created ${formType} form`);
			}
			return formId;
		}

		const preTestFormId = yield* createTestForm("pre_test", "Frontend Basics Pre-Test");
		const postTestFormId = yield* createTestForm("post_test", "Frontend Basics Post-Test");

		// Seed questions for pre/post test forms
		for (const formId of [preTestFormId, postTestFormId]) {
			const existingQs = yield* db
				.select()
				.from(questions)
				.where(eq(questions.formId, formId));

			if (existingQs.length > 0) continue;

			yield* Effect.all(
				FRONTEND_QUESTIONS.map((q, idx) =>
					db.insert(questions).values({
						id: randomString(),
						formId,
						type: "mcq",
						questionText: `[${q.bloomLevel}] ${q.questionText}`,
						options: JSON.stringify({
							type: "mcq",
							options: q.options,
							correctOptionIds: [q.correctOptionId],
							shuffle: false,
						}),
						orderIndex: idx,
						required: true,
					}),
				),
				{ concurrency: 10 },
			);
		}
		yield* Effect.log(`  Created ${FRONTEND_QUESTIONS.length} questions per test form`);

		return {
			tamFormId,
			feedbackFormId,
			preTestFormId,
			postTestFormId,
		};
	});
}

const FRONTEND_TOPIC = {
	title: "Frontend Web Development",
	description: "Introduction to HTML, CSS, and basic JavaScript for web development",
};

const FRONTEND_MATERIAL_DATA = {
	title: "Frontend Web Development Basics",
	description: "Introduction to HTML structure, CSS styling, and basic JavaScript",
	nodes: [
		{
			id: "web",
			type: "text" as const,
			position: { x: 340, y: 40 },
			data: { label: "Web Page", color: "green" },
		},
		{
			id: "html",
			type: "text" as const,
			position: { x: 140, y: 170 },
			data: { label: "HTML", color: "blue" },
		},
		{
			id: "css",
			type: "text" as const,
			position: { x: 340, y: 170 },
			data: { label: "CSS", color: "blue" },
		},
		{
			id: "js",
			type: "text" as const,
			position: { x: 540, y: 170 },
			data: { label: "JavaScript", color: "blue" },
		},
		{
			id: "structure",
			type: "text" as const,
			position: { x: 80, y: 320 },
			data: { label: "Structure", color: "amber" },
		},
		{
			id: "tags",
			type: "text" as const,
			position: { x: 200, y: 320 },
			data: { label: "Tags", color: "amber" },
		},
		{
			id: "style",
			type: "text" as const,
			position: { x: 260, y: 320 },
			data: { label: "Style", color: "amber" },
		},
		{
			id: "layout",
			type: "text" as const,
			position: { x: 380, y: 320 },
			data: { label: "Layout", color: "amber" },
		},
		{
			id: "color",
			type: "text" as const,
			position: { x: 260, y: 460 },
			data: { label: "Color", color: "amber" },
		},
		{
			id: "size",
			type: "text" as const,
			position: { x: 380, y: 460 },
			data: { label: "Size", color: "amber" },
		},
		{
			id: "events",
			type: "text" as const,
			position: { x: 500, y: 320 },
			data: { label: "Events", color: "amber" },
		},
		{
			id: "click",
			type: "text" as const,
			position: { x: 620, y: 320 },
			data: { label: "Clicks", color: "amber" },
		},
		{
			id: "alert",
			type: "text" as const,
			position: { x: 500, y: 460 },
			data: { label: "Alerts", color: "amber" },
		},
		{
			id: "change",
			type: "text" as const,
			position: { x: 620, y: 460 },
			data: { label: "Changes", color: "amber" },
		},
		{
			id: "conn-web",
			type: "connector" as const,
			position: { x: 340, y: 110 },
			data: { label: "uses" },
		},
		{
			id: "conn-structure",
			type: "connector" as const,
			position: { x: 140, y: 250 },
			data: { label: "creates" },
		},
		{
			id: "conn-style",
			type: "connector" as const,
			position: { x: 320, y: 400 },
			data: { label: "sets" },
		},
		{
			id: "conn-events",
			type: "connector" as const,
			position: { x: 560, y: 250 },
			data: { label: "handles" },
		},
	],
	edges: [
		{ id: "e1", source: "web", target: "conn-web" },
		{ id: "e2", source: "conn-web", target: "html" },
		{ id: "e3", source: "conn-web", target: "css" },
		{ id: "e4", source: "conn-web", target: "js" },
		{ id: "e5", source: "html", target: "conn-structure" },
		{ id: "e6", source: "conn-structure", target: "structure" },
		{ id: "e7", source: "html", target: "tags" },
		{ id: "e8", source: "css", target: "style" },
		{ id: "e9", source: "css", target: "layout" },
		{ id: "e10", source: "style", target: "conn-style" },
		{ id: "e11", source: "conn-style", target: "color" },
		{ id: "e12", source: "conn-style", target: "size" },
		{ id: "e13", source: "js", target: "conn-events" },
		{ id: "e14", source: "conn-events", target: "events" },
		{ id: "e15", source: "events", target: "click" },
		{ id: "e16", source: "events", target: "alert" },
		{ id: "e17", source: "events", target: "change" },
	],
};

// Minimal content for seeding - full content should be entered manually in the app
const FRONTEND_CONTENT = `# Frontend Web Development Basics

Frontend web development is the practice of building what users see and interact with on websites. There are three main technologies: **HTML**, **CSS**, and **JavaScript**.

## HTML: The Structure

HTML stands for **HyperText Markup Language**. It provides the structure and content of web pages.

### Basic HTML Tags

Every HTML document starts with this structure:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello World</h1>
    <p>This is a paragraph.</p>
</body>
</html>
\`\`\`

### Common HTML Elements

**Headings** create titles: \`<h1>Main Title</h1>\`

**Paragraphs** contain text: \`<p>This is a paragraph.</p>\`

**Links** connect pages: \`<a href="https://example.com">Click here</a>\`

**Images** display pictures: \`<img src="photo.jpg" alt="Description">\`

## CSS: The Style

CSS stands for **Cascading Style Sheets**. It controls how HTML elements look.

### Basic CSS Properties

\`\`\`css
/* Make all h1 elements blue */
h1 {
    color: blue;
}

/* Make paragraphs centered */
p {
    text-align: center;
}
\`\`\`

## JavaScript: The Behavior

JavaScript makes webpages interactive.

### Simple JavaScript Examples

\`\`\`javascript
function changeText() {
    document.getElementById('title').textContent = 'New Title!';
}
\`\`\`
`;

export function seedWri2026TopicsAndGoalMaps(teacherId: string) {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding WRI 2026 Topics & Goal Maps ---");

		// Create or update the Frontend Web Development topic
		const existingTopic = yield* db
			.select()
			.from(topics)
			.where(eq(topics.title, FRONTEND_TOPIC.title))
			.limit(1);

		let topicId: string;
		if (existingTopic[0]) {
			topicId = existingTopic[0].id;
			yield* db
				.update(topics)
				.set({ description: FRONTEND_TOPIC.description })
				.where(eq(topics.id, topicId));
			yield* Effect.log(`  Updated topic: ${FRONTEND_TOPIC.title}`);
		} else {
			topicId = randomString();
			yield* db.insert(topics).values({
				id: topicId,
				title: FRONTEND_TOPIC.title,
				description: FRONTEND_TOPIC.description,
			});
			yield* Effect.log(`  Created topic: ${FRONTEND_TOPIC.title}`);
		}

		// Create or update the text (reading material)
		const existingText = yield* db
			.select()
			.from(texts)
			.where(eq(texts.title, FRONTEND_MATERIAL_DATA.title))
			.limit(1);

		let textId: string;
		if (existingText[0]) {
			textId = existingText[0].id;
			yield* db.update(texts).set({ content: FRONTEND_CONTENT }).where(eq(texts.id, textId));
			yield* Effect.log(`  Updated text: ${FRONTEND_MATERIAL_DATA.title}`);
		} else {
			textId = randomString();
			yield* db.insert(texts).values({
				id: textId,
				title: FRONTEND_MATERIAL_DATA.title,
				content: FRONTEND_CONTENT,
			});
			yield* Effect.log(`  Created text: ${FRONTEND_MATERIAL_DATA.title}`);
		}

		// Create or update the goal map
		const existingGoalMap = yield* db
			.select()
			.from(goalMaps)
			.where(eq(goalMaps.title, FRONTEND_MATERIAL_DATA.title))
			.limit(1);

		let goalMapId: string;
		if (existingGoalMap[0]) {
			goalMapId = existingGoalMap[0].id;
			yield* db
				.update(goalMaps)
				.set({
					nodes: FRONTEND_MATERIAL_DATA.nodes,
					edges: FRONTEND_MATERIAL_DATA.edges,
				})
				.where(eq(goalMaps.id, goalMapId));
			yield* Effect.log(`  Updated goal map: ${FRONTEND_MATERIAL_DATA.title}`);
		} else {
			goalMapId = randomString();
			yield* db.insert(goalMaps).values({
				id: goalMapId,
				teacherId: teacherId,
				title: FRONTEND_MATERIAL_DATA.title,
				description: FRONTEND_MATERIAL_DATA.description,
				nodes: FRONTEND_MATERIAL_DATA.nodes,
				edges: FRONTEND_MATERIAL_DATA.edges,
				topicId: topicId,
				textId: textId,
			});
			yield* Effect.log(
				`  Created goal map: ${FRONTEND_MATERIAL_DATA.title} (${goalMapId.slice(0, 8)}...)`,
			);
		}

		return { topicId, goalMapId, textId };
	});
}
