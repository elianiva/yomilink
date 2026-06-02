import { createClient } from "@libsql/client";

const db = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
	// Get TAM form
	const tamFormId = (await db.execute("SELECT id FROM forms WHERE title LIKE '%TAM%'")).rows[0]!
		.id as string;

	// TAM questions in order
	const questions = await db.execute({
		sql: "SELECT id, order_index, question_text FROM questions WHERE form_id = ? ORDER BY order_index",
		args: [tamFormId],
	});

	console.log("=== TAM QUESTIONS ===");
	for (const q of questions.rows) {
		console.log(`  ${q.order_index}. ${q.question_text} [${q.id}]`);
	}

	const qIds = questions.rows.map((r: any) => r.id);
	const qTexts = questions.rows.map((r: any) => r.question_text);
	const puIds = qIds.slice(0, 5);
	const peuIds = qIds.slice(5, 10);

	// Get all responses
	const responses = await db.execute({
		sql: "SELECT user_id, answers FROM form_responses WHERE form_id = ?",
		args: [tamFormId],
	});

	// Get user info
	const users = await db.execute("SELECT id, email FROM user");
	const userMap = new Map(users.rows.map((r: any) => [r.id, r.email]));

	// Per-item collection
	const itemScores: { [key: string]: number[] } = {};
	for (const id of qIds) itemScores[id] = [];

	const puAverages: number[] = [];
	const peuAverages: number[] = [];

	for (const r of responses.rows) {
		const answers = JSON.parse(r.answers as string);
		const email = userMap.get(r.user_id as string) || r.user_id;

		// Per-item
		for (const id of qIds) {
			const val = parseInt(answers[id]);
			if (!isNaN(val)) itemScores[id].push(val);
		}

		// Construct averages
		let puS = 0,
			peuS = 0;
		for (const id of puIds) puS += parseInt(answers[id]) || 0;
		for (const id of peuIds) peuS += parseInt(answers[id]) || 0;
		puAverages.push(puS / puIds.length);
		peuAverages.push(peuS / peuIds.length);
	}

	const n = responses.rows.length;

	console.log(`\n=== PER-ITEM TAM (n=${n}) ===`);
	for (let i = 0; i < qIds.length; i++) {
		const scores = itemScores[qIds[i]];
		const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
		const category = i < 5 ? "PU" : "PEoU";
		console.log(`  ${category}${i + 1}: ${qTexts[i].substring(0, 50)}...`);
		console.log(`    Scores: ${scores.join(", ")}`);
		console.log(`    Mean: ${mean.toFixed(2)}`);
	}

	// Overall
	const puMean = puAverages.reduce((a, b) => a + b, 0) / puAverages.length;
	const peuMean = peuAverages.reduce((a, b) => a + b, 0) / peuAverages.length;

	console.log(`\n=== OVERALL TAM ===`);
	console.log(`N = ${n}`);
	console.log(`PU mean = ${puMean.toFixed(2)}`);
	console.log(`PEoU mean = ${peuMean.toFixed(2)}`);

	// SD
	const puSd = Math.sqrt(
		puAverages.map((x) => (x - puMean) ** 2).reduce((a, b) => a + b, 0) /
			(puAverages.length - 1),
	);
	const peuSd = Math.sqrt(
		peuAverages.map((x) => (x - peuMean) ** 2).reduce((a, b) => a + b, 0) /
			(peuAverages.length - 1),
	);
	console.log(`PU SD = ${puSd.toFixed(2)}`);
	console.log(`PEoU SD = ${peuSd.toFixed(2)}`);

	// Get feedback responses
	const fbFormId = (await db.execute("SELECT id FROM forms WHERE title LIKE '%Feedback%'"))
		.rows[0]!.id as string;
	const fbQuestions = await db.execute({
		sql: "SELECT id, order_index, question_text FROM questions WHERE form_id = ? ORDER BY order_index",
		args: [fbFormId],
	});
	console.log(`\n=== FEEDBACK QUESTIONS ===`);
	for (const q of fbQuestions.rows) {
		console.log(`  ${q.order_index}. ${q.question_text}`);
	}

	const fbResponses = await db.execute({
		sql: "SELECT user_id, answers FROM form_responses WHERE form_id = ?",
		args: [fbFormId],
	});
	console.log(`\n=== FEEDBACK RESPONSES (${fbResponses.rows.length}) ===`);

	const fbQIds = fbQuestions.rows.map((r: any) => r.id);
	const fbQTexts = fbQuestions.rows.map((r: any) => r.question_text);

	for (const r of fbResponses.rows) {
		const answers = JSON.parse(r.answers as string);
		const email = userMap.get(r.user_id as string) || r.user_id;
		console.log(`\n${email}:`);
		for (let i = 0; i < fbQIds.length; i++) {
			const answer = answers[fbQIds[i]] || "(no answer)";
			console.log(`  Q${i + 1}: ${answer}`);
		}
	}
}

main().catch(console.error);
