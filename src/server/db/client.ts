import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

export function createDb(url: string, authToken?: string) {
	const client = createClient({ url, authToken });
	return drizzle({ client });
}
