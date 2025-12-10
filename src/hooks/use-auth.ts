import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/server/rpc/auth";

export type Role = "teacher" | "admin" | "student";

export type AuthUser = {
	id: string;
	role: Role;
	email: string | null;
	name: string | null;
	image?: string | null;
} | null;

export function useAuth() {
	const { data } = useQuery({ queryKey: ["me"], queryFn: () => getMe() });
	return { user: data ?? null, isAuthenticated: Boolean(data) };
}
