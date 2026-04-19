import { eq } from "drizzle-orm";
import { Effect } from "effect";

import { Database } from "@/server/db/client";
import { whitelistEntries } from "@/server/db/schema/auth-schema";

const SEEDED_WHITELIST_ENTRIES = [
	{ id: "whitelist-demo-1", studentId: "20260001", name: "Tanaka Hanako" },
	{ id: "whitelist-demo-2", studentId: "20260002", name: "Suzuki Ken" },
	{ id: "whitelist-demo-3", studentId: "20260003", name: "Sato Yui" },
	{ id: "whitelist-demo-4", studentId: "20260004", name: "Yamada Haru" },
	{ id: "whitelist-demo-5", studentId: "20260005", name: "Kobayashi Mei" },
	{ id: "whitelist-demo-6", studentId: "20260006", name: "Ito Rina" },
	{ id: "whitelist-demo-7", studentId: "20260007", name: "Nakamura Ren" },
	{ id: "whitelist-demo-8", studentId: "20260008", name: "Watanabe Aya" },
	{ id: "whitelist-demo-9", studentId: "20260009", name: "Takahashi Yuna" },
	{ id: "whitelist-demo-10", studentId: "20260010", name: "Matsumoto Sora" },
	{ id: "whitelist-demo-11", studentId: "20260011", name: "Kato Mio" },
	{ id: "whitelist-demo-12", studentId: "20260012", name: "Fujita Rei" },
	{ id: "whitelist-demo-13", studentId: "20260013", name: "Sakai Nao" },
	{ id: "whitelist-demo-14", studentId: "20260014", name: "Arai Kiko" },
	{ id: "whitelist-demo-15", studentId: "20260015", name: "Mori Yuna" },
	{ id: "whitelist-demo-16", studentId: "20260016", name: "Okada Rei" },
	{ id: "whitelist-demo-17", studentId: "20260017", name: "Hayashi Mei" },
	{ id: "whitelist-demo-18", studentId: "20260018", name: "Ishikawa Rio" },
	{ id: "whitelist-demo-19", studentId: "20260019", name: "Murakami Ao" },
	{ id: "whitelist-demo-20", studentId: "20260020", name: "Shimizu Hina" },
] as const;

export function seedWhitelistEntries() {
	return Effect.gen(function* () {
		const db = yield* Database;

		yield* Effect.log("--- Seeding Whitelist Entries ---");

		for (const entry of SEEDED_WHITELIST_ENTRIES) {
			const existing = yield* db
				.select()
				.from(whitelistEntries)
				.where(eq(whitelistEntries.studentId, entry.studentId))
				.limit(1);

			if (existing[0]) {
				yield* Effect.log(`Whitelist entry ${entry.studentId} already exists`);
				continue;
			}

			yield* db.insert(whitelistEntries).values({
				id: entry.id,
				studentId: entry.studentId,
				name: entry.name,
			});
			yield* Effect.log(`Created whitelist entry: ${entry.studentId}`);
		}
	});
}
