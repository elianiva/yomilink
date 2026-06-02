import { createClient } from "@libsql/client";

const db = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
	// Get TAM form
	const tamForm = (await db.execute("SELECT id FROM forms WHERE type = 'questionnaire' LIMIT 1")).rows[0];
	
	// Get TAM questions with their order
	const questions = await db.execute({
		sql: "SELECT id, order_index FROM questions WHERE form_id = ? ORDER BY order_index",
		args: [tamForm!.id as string],
	});
	
	const qIds = questions.rows.map((r: any) => r.id);
	const qOrders = questions.rows.map((r: any) => r.order_index);
	console.log("Question order indices:", qOrders);
	console.log("Question IDs:", qIds);
	
	// First 5 = PU (indices 0-4), Next 5 = PEoU (indices 5-9)
	const puIds = qIds.slice(0, 5);
	const peuIds = qIds.slice(5, 10);
	console.log("\nPU IDs:", puIds);
	console.log("PEoU IDs:", peuIds);

	// Get responses
	const responses = await db.execute({
		sql: "SELECT user_id, answers FROM form_responses WHERE form_id = ?",
		args: [tamForm!.id as string],
	});
	
	console.log(`\nTotal TAM responses: ${responses.rows.length}`);
	
	// Get user emails
	const allUsers = await db.execute("SELECT id, email FROM user");
	const userMap = new Map(allUsers.rows.map((r: any) => [r.id, r.email]));
	
	let puSum = 0, peuSum = 0, count = 0;
	const studentTamData: any[] = [];
	
	for (const r of responses.rows) {
		const answers = JSON.parse(r.answers as string);
		const email = userMap.get(r.user_id as string) || r.user_id;
		
		let puTotal = 0, peuTotal = 0;
		let puCount = 0, peuCount = 0;
		const puVals: number[] = [];
		const peuVals: number[] = [];
		
		for (const qId of puIds) {
			const val = parseInt(answers[qId as string]);
			if (!isNaN(val)) {
				puTotal += val;
				puCount++;
				puVals.push(val);
			}
		}
		for (const qId of peuIds) {
			const val = parseInt(answers[qId as string]);
			if (!isNaN(val)) {
				peuTotal += val;
				peuCount++;
				peuVals.push(val);
			}
		}
		
		const puMean = puTotal / puCount;
		const peuMean = peuTotal / peuCount;
		
		puSum += puMean;
		peuSum += peuMean;
		count++;
		
		studentTamData.push({
			email,
			pu: puVals,
			puMean,
			peu: peuVals,
			peuMean,
		});
		
		console.log(`\n${email}:`);
		console.log(`  PU: ${puVals.join(", ")} (mean=${puMean.toFixed(2)})`);
		console.log(`  PEoU: ${peuVals.join(", ")} (mean=${peuMean.toFixed(2)})`);
	}
	
	if (count > 0) {
		console.log(`\n=== OVERALL TAM RESULTS ===`);
		console.log(`N = ${count}`);
		console.log(`PU mean = ${(puSum / count).toFixed(2)}`);
		console.log(`PEoU mean = ${(peuSum / count).toFixed(2)}`);
		console.log(`Threshold = 3.5`);
		console.log(`PU accepted: ${(puSum / count) >= 3.5 ? "YES" : "NO"}`);
		console.log(`PEoU accepted: ${(peuSum / count) >= 3.5 ? "YES" : "NO"}`);
	}
	
	const feedbackForm = (await db.execute({ sql: "SELECT id FROM forms WHERE type = ? ORDER BY created_at DESC LIMIT 1", args: ["questionnaire"] })).rows[1];
	if (feedbackForm) {
		const fbResponses = await db.execute({
			sql: "SELECT user_id, answers FROM form_responses WHERE form_id = ?",
			args: [feedbackForm.id as string],
		});
		console.log(`\n=== FEEDBACK RESPONSES: ${fbResponses.rows.length} ===`);
	}

	// Pre/post test data for remaining 35 students
	const preForm = (await db.execute("SELECT id FROM forms WHERE type = 'pre_test'")).rows[0];
	const postForm = (await db.execute("SELECT id FROM forms WHERE type = 'post_test'")).rows[0];
	
	if (preForm && postForm) {
		const pre = await db.execute({
			sql: "SELECT fr.user_id, fr.answers FROM form_responses fr WHERE fr.form_id = ?",
			args: [preForm.id as string],
		});
		const post = await db.execute({
			sql: "SELECT fr.user_id, fr.answers FROM form_responses fr WHERE fr.form_id = ?",
			args: [postForm.id as string],
		});
		console.log(`\nPre-test responses: ${pre.rows.length}`);
		console.log(`Post-test responses: ${post.rows.length}`);
		
		// Get questions to understand scoring
		const preQuestions = await db.execute({
			sql: "SELECT id, order_index FROM questions WHERE form_id = ? ORDER BY order_index",
			args: [preForm.id as string],
		});
		console.log(`Pre-test questions: ${preQuestions.rows.length}`);
	}
}

main().catch(console.error);
