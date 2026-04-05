import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { listTopics, createTopic, CreateTopicInput } from "@/features/analyzer/lib/topic-service";
import { authMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError, logAndReturnError, logAndReturnDefect } from "../rpc-helper";

export const listTopicsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		listTopics().pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listTopics"),
			Effect.tapError(logRpcError("listTopics")),
			Effect.catchAll(logAndReturnError("listTopics")),
			Effect.catchAllDefect(logAndReturnDefect("listTopics")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const createTopicRpc = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateTopicInput)(raw))
	.handler(({ data }) =>
		createTopic(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("createTopic"),
			Effect.tapError(logRpcError("createTopic")),
			Effect.catchAll(logAndReturnError("createTopic")),
			Effect.catchAllDefect(logAndReturnDefect("createTopic")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const TopicRpc = {
	topics: () => ["topics"],
	listTopics: () =>
		queryOptions({
			queryKey: [...TopicRpc.topics()],
			queryFn: () => listTopicsRpc(),
		}),
	createTopic: () =>
		mutationOptions({
			mutationKey: [...TopicRpc.topics()],
			mutationFn: (data: CreateTopicInput) => createTopicRpc({ data }),
		}),
};
