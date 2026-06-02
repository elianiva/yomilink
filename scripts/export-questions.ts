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

function writeCsv(name: string, rows: Record<string, unknown>[]) {
	if (!rows.length) return;
	const headers = Object.keys(rows[0]);
	const lines = rows.map((r) => headers.map((h) => esc(r[h])).join(","));
	const csv = [headers.join(","), ...lines].join("\n");
	fs.mkdirSync("exports", { recursive: true });
	fs.writeFileSync(`exports/${name}`, csv, "utf-8");
	console.log(`  exports/${name}  (${rows.length} rows)`);
}

async function main() {
	console.log("Exporting instrument questions…\n");

	const { rows: forms } = await db.execute("SELECT id, title, type FROM forms");

	const typeLabels: Record<string, string> = {
		tam: "tam",
		questionnaire: "feedback",
		pre_test: "pretest",
		post_test: "posttest",
	};

	const seen = new Map<string, number>();
	for (const f of forms as any[]) {
		const label = typeLabels[f.type];
		if (!label) continue;

		const { rows: qs } = await db.execute({
			sql: `SELECT q.order_index, q.question_text, q.type, q.options
						FROM questions q WHERE q.form_id = ? ORDER BY q.order_index`,
			args: [f.id],
		});

		const count = (seen.get(label) ?? 0) + 1;
		seen.set(label, count);
		const suffix = count > 1 ? `_${count}` : "";
		writeCsv(`questions_${label}${suffix}.csv`, qs as Record<string, unknown>[]);
	}

	console.log("\nDone.");
}

main().catch((err) => {
	console.error("Export failed:", err);
	process.exit(1);
});
