import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "convex/_generated/api";

export type Role = "teacher" | "admin" | "student";

export type AuthUser = {
	id: string;
	role: Role;
	email: string | null;
	name: string | null;
	image?: string | null;
} | null;

export function useAuth() {
	const { data } = useQuery(convexQuery(api.users.me, {}));
	return {
		user: data as AuthUser,
		isAuthenticated: Boolean(data),
	};
}
