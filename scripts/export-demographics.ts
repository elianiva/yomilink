import { createClient } from "@libsql/client";

const db = createClient({
	url: process.env.TURSO_DATABASE_URL!,
	authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
	// Get student demographic data
	const students = await db.execute(
		"SELECT email, name, age, jlpt_level, japanese_learning_duration, previous_japanese_score, media_consumption, motivation, study_group FROM user WHERE role = 'student' ORDER BY email"
	);
	
	console.log(`Total students: ${students.rows.length}`);
	
	let ageSum = 0, ageCount = 0;
	let durSum = 0, durCount = 0;
	let scoreSum = 0, scoreCount = 0;
	let mediaSum = 0, mediaCount = 0;
	const jlptCount: Record<string, number> = {};
	const studyGroupCount: Record<string, number> = {};
	
	console.log("\n=== STUDENT DEMOGRAPHICS ===");
	for (const s of students.rows) {
		const age = s.age as number | null;
		const duration = s.japanese_learning_duration as number | null;
		const score = s.previous_japanese_score as number | null;
		const media = s.media_consumption as number | null;
		const jlpt = (s.jlpt_level as string) || "None";
		const group = (s.study_group as string) || "none";
		
		if (age !== null) { ageSum += age; ageCount++; }
		if (duration !== null) { durSum += duration; durCount++; }
		if (score !== null) { scoreSum += score; scoreCount++; }
		if (media !== null) { mediaSum += media; mediaCount++; }
		jlptCount[jlpt] = (jlptCount[jlpt] || 0) + 1;
		studyGroupCount[group] = (studyGroupCount[group] || 0) + 1;
		
		// Print first 5 as sample
		if (ageCount <= 5) {
			console.log(`  ${s.email}: age=${age}, JLPT=${jlpt}, months=${duration}, prevScore=${score}, media=${media}h/w, group=${group}`);
		}
	}
	
	console.log(`\n=== DEMOGRAPHIC SUMMARY ===`);
	if (ageCount > 0) console.log(`Age: mean=${(ageSum/ageCount).toFixed(1)}, n=${ageCount}`);
	if (durCount > 0) console.log(`Study duration (months): mean=${(durSum/durCount).toFixed(1)}, n=${durCount}`);
	if (scoreCount > 0) console.log(`Previous Japanese score: mean=${(scoreSum/scoreCount).toFixed(1)}, n=${scoreCount}`);
	if (mediaCount > 0) console.log(`Media consumption (hrs/wk): mean=${(mediaSum/mediaCount).toFixed(1)}, n=${mediaCount}`);
	
	console.log(`\nJLPT Level distribution:`);
	for (const [k, v] of Object.entries(jlptCount).sort()) {
		console.log(`  ${k}: ${v}`);
	}
	
	console.log(`\nStudy group distribution:`);
	for (const [k, v] of Object.entries(studyGroupCount).sort()) {
		console.log(`  ${k}: ${v}`);
	}
	
	// Student emails for matching with experiment data
	console.log(`\nAll student emails (for cross-reference):`);
	const studentEmails = students.rows.map((s: any) => s.email);
	console.log(studentEmails.join("\n"));
}

main().catch(console.error);
