import { createServerFn } from "@tanstack/react-start";
import { auth } from "@/server/auth/config";

export type AuthUser = {
	id: string;
	role: "teacher" | "admin" | "student";
	email: string | null;
	name: string | null;
	image?: string | null;
} | null;

export const getMe = createServerFn({ method: "GET" }).handler(async () => {
	const session = await auth.api.getSession();
	if (!session) return null as AuthUser;
	return {
		id: session.user.id,
		role: (session.user as any).role ?? "student",
		email: session.user.email ?? null,
		name: session.user.name ?? null,
		image: (session.user as any).image ?? null,
	} as AuthUser;
});
