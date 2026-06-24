import * as fs from "fs";

import { createClient } from "@libsql/client";

const db = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
});

function esc(val: unknown): string {
	if (val === null || val === undefined) return "";
	const s = String(val);
	if (s.includes(",") || s.includes("\n") || s.includes('"') || s.includes("\r")) {
		return `"${s.replace(/"/g, '""')}"`;
	}
	return s;
}

function mean(nums: number[]): number {
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function main() {
	// ── 1. Students ──────────────────────────────────────────────────────────
	const { rows: students } = await db.execute(
		`SELECT id, email, name, student_id, age, jlpt_level,
						japanese_learning_duration, previous_japanese_score,
						media_consumption, motivation, study_group, consent_given
				FROM user WHERE role = 'student'
				ORDER BY email`,
	);
	const studentMap = new Map(students.map((s: any) => [s.id, s]));

	// ── 2. Forms ─────────────────────────────────────────────────────────────
	const { rows: forms } = await db.execute("SELECT id, title, type FROM forms");
	const tamForm = forms.find((f: any) => f.type === "questionnaire" && (f.title as string).toLowerCase().includes("tam"));
	const preForm = forms.find((f: any) => f.type === "pre_test");
	const postForm = forms.find((f: any) => f.type === "post_test");
	const delayedForm = forms.find((f: any) => f.type === "delayed_test");
	const feedbackForm = forms.find((f: any) => f.type === "questionnaire" && (f.title as string).toLowerCase().includes("feedback"));
	const tamForm2 = forms.find((f: any) => f.type === "tam" && f.id !== tamForm?.id);

	// ── 3. Questions per form ────────────────────────────────────────────────
	async function getQuestions(formId: string) {
		if (!formId) return [];
		const { rows } = await db.execute({
			sql: "SELECT id, order_index, question_text, type FROM questions WHERE form_id = ? ORDER BY order_index",
			args: [formId],
		});
		return rows as { id: string; order_index: number; question_text: string; type: string }[];
	}

	const tamQs = await getQuestions(tamForm?.id);
	const preQs = await getQuestions(preForm?.id);
	const postQs = await getQuestions(postForm?.id);
	const delayedQs = await getQuestions(delayedForm?.id);

	// TAM: first 5 = PU, next 5 = PEoU
	const tamPuIds = tamQs.slice(0, 5).map((q) => q.id);
	const tamPeuIds = tamQs.slice(5, 10).map((q) => q.id);

	// ── 4. Responses ─────────────────────────────────────────────────────────
	async function getResponses(formId: string) {
		if (!formId) return [];
		const { rows } = await db.execute({
			sql: "SELECT user_id, answers, time_spent_seconds FROM form_responses WHERE form_id = ?",
			args: [formId],
		});
		return rows as { user_id: string; answers: string; time_spent_seconds: number }[];
	}

	const tamResponses = await getResponses(tamForm?.id);
	const preResponses = await getResponses(preForm?.id);
	const postResponses = await getResponses(postForm?.id);
	const delayedResponses = await getResponses(delayedForm?.id);
	const feedbackResponses = await getResponses(feedbackForm?.id);
	const tam2Responses = await getResponses(tamForm2?.id);

	function responseMap(responses: { user_id: string; answers: string }[]) {
		const m = new Map<string, Record<string, string>>();
		for (const r of responses) {
			m.set(r.user_id, JSON.parse(r.answers));
		}
		return m;
	}

	const tamAns = responseMap(tamResponses);
	const preAns = responseMap(preResponses);
	const postAns = responseMap(postResponses);
	const delayedAns = responseMap(delayedResponses);
	const feedbackAns = responseMap(feedbackResponses);
	const tam2Ans = responseMap(tam2Responses);

	// ── 5. Learner maps → scores ─────────────────────────────────────────────
	const { rows: lmRows } = await db.execute(
		`SELECT lm.user_id, lm.assignment_id, lm.attempt, lm.status,
						d.score, d.id AS diagnosis_id
				FROM learner_maps lm
				LEFT JOIN diagnoses d ON d.learner_map_id = lm.id
				ORDER BY lm.user_id, lm.assignment_id, lm.attempt`,
	);
	const lmByUser = new Map<string, any[]>();
	for (const r of lmRows as any[]) {
		if (!lmByUser.has(r.user_id)) lmByUser.set(r.user_id, []);
		lmByUser.get(r.user_id)!.push(r);
	}

	// ── 6. Feedback questions (for denormalization) ────────────────────────
	const fbQs = feedbackForm ? await getQuestions(feedbackForm.id) : [];

	// ── 7. Build rows ────────────────────────────────────────────────────────
	type Row = Record<string, unknown>;
	const rows: Row[] = [];

	for (const s of students as any[]) {
		const r: Row = {
			email: s.email,
			name: s.name,
			studentId: s.student_id,
			age: s.age,
			jlptLevel: s.jlpt_level,
			studyDurationMonths: s.japanese_learning_duration,
			prevScore: s.previous_japanese_score,
			mediaHoursWeek: s.media_consumption,
			motivation: s.motivation,
			studyGroup: s.study_group,
			consentGiven: s.consent_given,
		};

		// TAM
		const ta = tamAns.get(s.id);
		if (ta) {
			const puVals = tamPuIds.map((id) => parseInt(ta[id])).filter((v) => !isNaN(v));
			const peuVals = tamPeuIds.map((id) => parseInt(ta[id])).filter((v) => !isNaN(v));
			r.tamPuMean = puVals.length ? mean(puVals) : null;
			r.tamPeouMean = peuVals.length ? mean(peuVals) : null;

			// Individual items
			for (let i = 0; i < tamPuIds.length; i++) {
				r[`tamPu${i + 1}`] = parseInt(ta[tamPuIds[i]]) || null;
			}
			for (let i = 0; i < tamPeuIds.length; i++) {
				r[`tamPeou${i + 1}`] = parseInt(ta[tamPeuIds[i]]) || null;
			}
		}

		// TAM2 (if exists)
		const ta2 = tam2Ans.get(s.id);
		if (ta2) {
			const tam2AllQs = await getQuestions(tamForm2?.id);
			const tam2PuIds = tam2AllQs.slice(0, 5).map((q) => q.id);
			const tam2PeuIds = tam2AllQs.slice(5, 10).map((q) => q.id);
			const puVals2 = tam2PuIds.map((id) => parseInt(ta2[id])).filter((v) => !isNaN(v));
			const peuVals2 = tam2PeuIds.map((id) => parseInt(ta2[id])).filter((v) => !isNaN(v));
			r.tam2PuMean = puVals2.length ? mean(puVals2) : null;
			r.tam2PeouMean = peuVals2.length ? mean(peuVals2) : null;
		}

		// Pre-test
		const pra = preAns.get(s.id);
		if (pra && preQs.length) {
			const correct = preQs
				.map((q) => parseInt(pra[q.id]))
				.filter((v) => !isNaN(v));
			r.preTestCorrect = correct.filter((v) => v === 1).length;
			r.preTestTotal = preQs.length;
			r.preTestScore = r.preTestTotal ? (r.preTestCorrect as number) / (r.preTestTotal as number) : null;
		}

		// Post-test
		const poa = postAns.get(s.id);
		if (poa && postQs.length) {
			const correct = postQs
				.map((q) => parseInt(poa[q.id]))
				.filter((v) => !isNaN(v));
			r.postTestCorrect = correct.filter((v) => v === 1).length;
			r.postTestTotal = postQs.length;
			r.postTestScore = r.postTestTotal ? (r.postTestCorrect as number) / (r.postTestTotal as number) : null;
		}

		// Delayed post-test
		const dla = delayedAns.get(s.id);
		if (dla && delayedQs.length) {
			const correct = delayedQs
				.map((q) => parseInt(dla[q.id]))
				.filter((v) => !isNaN(v));
			r.delayedCorrect = correct.filter((v) => v === 1).length;
			r.delayedTotal = delayedQs.length;
			r.delayedScore = r.delayedTotal ? (r.delayedCorrect as number) / (r.delayedTotal as number) : null;
		}

		// Feedback (denormalized)
		const fb = feedbackAns.get(s.id);
		for (let i = 0; i < fbQs.length; i++) {
			r[`fb${i + 1}`] = fb ? (fb[fbQs[i].id] ?? null) : null;
		}

		// Learner map scores
		const lms = lmByUser.get(s.id) || [];
		const bestAttempts = new Map<string, any>();
		for (const lm of lms) {
			if (lm.status === "graded" && lm.score !== null) {
				const existing = bestAttempts.get(lm.assignment_id);
				if (!existing || lm.score > existing.score) {
					bestAttempts.set(lm.assignment_id, lm);
				}
			}
		}
		r.learnerMapCount = lms.length;
		r.learnerMapSubmitted = lms.filter((lm: any) => lm.status !== "draft").length;
		if (bestAttempts.size > 0) {
			const scores = [...bestAttempts.values()].map((lm: any) => lm.score);
			r.learnerMapAvgScore = mean(scores);
			r.learnerMapMaxScore = Math.max(...scores);
		}

		rows.push(r);
	}

	// ── 8. Write CSV ────────────────────────────────────────────────────────
	const headerSet = new Set<string>();
	for (const r of rows) Object.keys(r).forEach((k) => headerSet.add(k));
	const headers = [...headerSet];
	const lines = rows.map((r) => headers.map((h) => esc(r[h])).join(","));
	const csv = [headers.join(","), ...lines].join("\n");

	fs.mkdirSync("exports", { recursive: true });
	fs.writeFileSync("exports/aggregated.csv", csv, "utf-8");

	console.log(`  exports/aggregated.csv  (${rows.length} rows, ${headers.length} columns)`);
}

main().catch((err) => {
	console.error("Export failed:", err);
	process.exit(1);
});
