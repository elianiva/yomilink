import * as fs from "fs";

import { createClient } from "@libsql/client";

const db = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
	// Get all forms
	const forms = await db.execute("SELECT id, title, type, status, audience FROM forms");
	console.log("=== ALL FORMS ===");
	for (const row of forms.rows) {
		console.log(
			`  ${row.id}: ${row.title} (type=${row.type}, status=${row.status}, audience=${row.audience})`,
		);
	}

	// Get all users
	const users = await db.execute("SELECT id, email, name, role FROM user");
	console.log(`\n=== USERS (${users.rows.length}) ===`);
	for (const row of users.rows) {
		console.log(`  ${row.id}: ${row.email}, role=${row.role}, cohort=${row.cohort_id}`);
	}

	// Get TAM form responses
	const tamForms = forms.rows.filter((r: any) => r.type === "tam");
	for (const tam of tamForms) {
		console.log(`\n=== TAM: ${tam.title} (${tam.id}) ===`);
		const questions = await db.execute({
			sql: "SELECT id, question_text, type, order_index FROM questions WHERE form_id = ? ORDER BY order_index",
			args: [tam.id as string],
		});
		console.log("  Questions:");
		for (const q of questions.rows) {
			console.log(`    ${q.order_index}. ${q.question_text} [${q.type}]`);
		}

		const responses = await db.execute({
			sql: "SELECT user_id, answers, time_spent_seconds FROM form_responses WHERE form_id = ?",
			args: [tam.id as string],
		});
		console.log(`  Responses: ${responses.rows.length}`);
		for (const r of responses.rows) {
			const student = users.rows.find((u: any) => u.id === r.user_id);
			console.log(`  Student ${student?.email || r.user_id}:`);
			console.log(`    ${r.answers}`);
		}
	}

	// Get feedback (questionnaire) form responses
	const fbForms = forms.rows.filter((r: any) => r.type === "questionnaire");
	for (const fb of fbForms) {
		console.log(`\n=== FEEDBACK: ${fb.title} (${fb.id}) ===`);
		const questions = await db.execute({
			sql: "SELECT id, question_text, type, order_index FROM questions WHERE form_id = ? ORDER BY order_index",
			args: [fb.id as string],
		});
		console.log("  Questions:");
		for (const q of questions.rows) {
			console.log(`    ${q.order_index}. ${q.question_text} [${q.type}]`);
		}

		const responses = await db.execute({
			sql: "SELECT user_id, answers, time_spent_seconds FROM form_responses WHERE form_id = ?",
			args: [fb.id as string],
		});
		console.log(`  Responses: ${responses.rows.length}`);
		for (const r of responses.rows) {
			const student = users.rows.find((u: any) => u.id === r.user_id);
			console.log(`  Student ${student?.email || r.user_id}:`);
			console.log(`    ${r.answers}`);
		}
	}

	// Get assignments for context
	const assignments = await db.execute("SELECT id, title FROM assignments");
	console.log(`\n=== ASSIGNMENTS ===`);
	for (const a of assignments.rows) {
		console.log(`  ${a.id}: ${a.title}`);
	}

	// Get learner maps count
	const learnerMaps = await db.execute("SELECT COUNT(*) as count FROM learner_maps");
	console.log(`\n=== LEARNER MAPS: ${learnerMaps.rows[0].count} ===`);
}

main().catch(console.error);
