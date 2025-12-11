import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { getServerUser } from "@/lib/auth";

export const getMe = createServerFn({ method: "GET" }).handler(() =>
	getServerUser(getRequest().headers),
);
