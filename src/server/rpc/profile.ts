import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/middlewares/auth";

export const getMe = createServerFn()
	.middleware([authMiddleware])
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
