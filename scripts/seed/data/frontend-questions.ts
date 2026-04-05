import type { McqOption, ReadingQuestion } from "./questions.js";

// Generate stable option IDs for questions
function generateOptionId(questionIndex: number, optionIndex: number): string {
	return `fe_q${questionIndex}_opt${optionIndex}`;
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

export const FRONTEND_QUESTIONS: ReadingQuestion[] = [
	// === HTML BASICS (L1-L2) ===
	{
		questionText: "What does HTML stand for?",
		options: createMcqOptions(0, [
			"Hyper Text Markup Language",
			"High Tech Modern Language",
			"Hyper Transfer Make Link",
			"Home Tool Markup Language",
		]),
		correctOptionId: generateOptionId(0, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "HTML stands for Hyper Text Markup Language",
	},
	{
		questionText: "Which HTML tag creates the main heading of a page?",
		options: createMcqOptions(1, ["<head>", "<header>", "<h1>", "<main>"]),
		correctOptionId: generateOptionId(1, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "<h1> defines the main heading",
	},
	{
		questionText: "Which tag creates a paragraph of text?",
		options: createMcqOptions(2, ["<para>", "<p>", "<text>", "<paragraph>"]),
		correctOptionId: generateOptionId(2, 1),
		bloomLevel: "L1-Remembering",
		targetInfo: "<p> tag creates paragraphs",
	},
	{
		questionText: "Which attribute is used to add an image to a webpage?",
		options: createMcqOptions(3, ["url", "link", "src", "href"]),
		correctOptionId: generateOptionId(3, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "src attribute specifies image URL",
	},
	{
		questionText: "What does the <a> tag create?",
		options: createMcqOptions(4, [
			"A paragraph",
			"A heading",
			"A hyperlink (link)",
			"An image",
		]),
		correctOptionId: generateOptionId(4, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "<a> tag creates hyperlinks",
	},
	{
		questionText: "What is the purpose of the alt attribute in an <img> tag?",
		options: createMcqOptions(5, [
			"To make the image load faster",
			"To provide alternative text if the image cannot be displayed",
			"To change the image size",
			"To add a caption",
		]),
		correctOptionId: generateOptionId(5, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "alt provides alternative text for accessibility",
	},
	{
		questionText: "What is the difference between <div> and <span>?",
		options: createMcqOptions(6, [
			"<div> is for images, <span> is for text",
			"<div> starts on a new line, <span> stays inline",
			"<div> is newer than <span>",
			"They are exactly the same",
		]),
		correctOptionId: generateOptionId(6, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "<div> is block level, <span> is inline",
	},
	{
		questionText: "Which HTML element contains all the visible content of the webpage?",
		options: createMcqOptions(7, ["<head>", "<body>", "<html>", "<visible>"]),
		correctOptionId: generateOptionId(7, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "<body> contains the visible page content",
	},

	// === CSS BASICS (L1-L2) ===
	{
		questionText: "What does CSS stand for?",
		options: createMcqOptions(8, [
			"Computer Style Sheets",
			"Cascading Style Sheets",
			"Creative Style System",
			"Colorful Styling Software",
		]),
		correctOptionId: generateOptionId(8, 1),
		bloomLevel: "L1-Remembering",
		targetInfo: "CSS stands for Cascading Style Sheets",
	},
	{
		questionText: "Which CSS property changes the text color?",
		options: createMcqOptions(9, ["text-color", "font-color", "color", "foreground"]),
		correctOptionId: generateOptionId(9, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "color property changes text color",
	},
	{
		questionText: "Which CSS property changes the background color?",
		options: createMcqOptions(10, ["bgcolor", "background-color", "color-bg", "back-color"]),
		correctOptionId: generateOptionId(10, 1),
		bloomLevel: "L1-Remembering",
		targetInfo: "background-color sets background",
	},
	{
		questionText: 'How do you select an element with id="header" in CSS?',
		options: createMcqOptions(11, ["#header", ".header", "header", "*header"]),
		correctOptionId: generateOptionId(11, 0),
		bloomLevel: "L1-Remembering",
		targetInfo: "#header selects by ID",
	},
	{
		questionText: "How do you select all <p> elements in CSS?",
		options: createMcqOptions(12, ["#p", ".p", "p", "*p"]),
		correctOptionId: generateOptionId(12, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "p selects all paragraph elements",
	},
	{
		questionText: "What unit is often used for font sizes in CSS?",
		options: createMcqOptions(13, ["inch", "px (pixels)", "meter", "gram"]),
		correctOptionId: generateOptionId(13, 1),
		bloomLevel: "L1-Remembering",
		targetInfo: "px (pixels) is commonly used for font sizes",
	},
	{
		questionText: "What does padding do in CSS?",
		options: createMcqOptions(14, [
			"Adds space outside the border",
			"Adds space inside the border, around the content",
			"Changes the border thickness",
			"Moves the element to the right",
		]),
		correctOptionId: generateOptionId(14, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "padding adds internal space around content",
	},
	{
		questionText: "What does margin do in CSS?",
		options: createMcqOptions(15, [
			"Adds space inside the border",
			"Adds space outside the border, between elements",
			"Changes the background color",
			"Makes text bold",
		]),
		correctOptionId: generateOptionId(15, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "margin adds external space between elements",
	},
	{
		questionText: "Which value for text-align centers text?",
		options: createMcqOptions(16, ["left", "right", "center", "justify"]),
		correctOptionId: generateOptionId(16, 2),
		bloomLevel: "L2-Understanding",
		targetInfo: "text-align: center centers the text",
	},
	{
		questionText: "If you want all paragraphs to be blue, which CSS rule should you write?",
		options: createMcqOptions(17, [
			"paragraph { color: blue; }",
			"p { color: blue; }",
			".p { color: blue; }",
			"#p { color: blue; }",
		]),
		correctOptionId: generateOptionId(17, 1),
		bloomLevel: "L2-Understanding",
		targetInfo: "p selector targets all paragraph elements",
	},
	{
		questionText:
			"You want to make a button with red background and white text. Which CSS properties would you use?",
		options: createMcqOptions(18, [
			"background and font-color",
			"background-color and color",
			"bgcolor and text",
			"fill and stroke",
		]),
		correctOptionId: generateOptionId(18, 1),
		bloomLevel: "L3-Applying",
		targetInfo: "background-color for background, color for text",
	},

	// === BASIC JAVASCRIPT CONCEPTS (L1-L2, very simple) ===
	{
		questionText: "What is JavaScript mainly used for on websites?",
		options: createMcqOptions(19, [
			"Styling web pages",
			"Adding structure to web pages",
			"Adding interactivity and behavior",
			"Storing files on a server",
		]),
		correctOptionId: generateOptionId(19, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "JavaScript adds interactivity to web pages",
	},
	{
		questionText: "Which keyword creates a variable that cannot be reassigned?",
		options: createMcqOptions(20, ["var", "let", "const", "static"]),
		correctOptionId: generateOptionId(20, 2),
		bloomLevel: "L1-Remembering",
		targetInfo: "const declares variables that cannot be reassigned",
	},
	{
		questionText: "What does document.getElementById() do?",
		options: createMcqOptions(21, [
			"Creates a new element",
			"Deletes an element",
			"Finds an element by its ID",
			"Changes the page title",
		]),
		correctOptionId: generateOptionId(21, 2),
		bloomLevel: "L2-Understanding",
		targetInfo: "getElementById selects DOM elements by ID",
	},
];

// Export a map of question index to correct option ID for response seeding
export const FRONTEND_CORRECT_ANSWERS: Record<number, string> = FRONTEND_QUESTIONS.reduce(
	(acc, q, idx) => {
		acc[idx] = q.correctOptionId;
		return acc;
	},
	{} as Record<number, string>,
);

// Export a map of question index to all option IDs for response seeding
export const FRONTEND_OPTION_IDS: Record<number, string[]> = FRONTEND_QUESTIONS.reduce(
	(acc, q, idx) => {
		acc[idx] = q.options.map((o) => o.id);
		return acc;
	},
	{} as Record<number, string[]>,
);
