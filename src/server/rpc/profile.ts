import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { authMiddlewareOptional } from "@/middlewares/auth";

export const getMe = createServerFn()
	.middleware([authMiddlewareOptional])
	.handler(async ({ context }) => {
		return context.user;
	});

export const ProfileRpc = {
	me: () => ["me"],
	getMe: () =>
		queryOptions({
			queryKey: ProfileRpc.me(),
			queryFn: () => getMe(),
		}),
};
