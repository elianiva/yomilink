import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/server/auth/config";

export const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
	const session = await auth.api.getSession();
	return { userId: session?.user.id };
});
