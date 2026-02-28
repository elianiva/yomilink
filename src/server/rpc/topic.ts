import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Schema } from "effect";

import { listTopics, createTopic, CreateTopicInput } from "@/features/analyzer/lib/topic-service";
import { authMiddleware } from "@/middlewares/auth";

import { AppLayer } from "../app-layer";
import { Rpc, logRpcError } from "../rpc-helper";

export const listTopicsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		listTopics().pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("listTopics"),
			Effect.tapError(logRpcError("listTopics")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
			Effect.provide(AppLayer),
			Effect.runPromise,
		),
	);

export const createTopicRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateTopicInput)(raw))
	.handler(({ data }) =>
		createTopic(data).pipe(
			Effect.map(Rpc.ok),
			Effect.withSpan("createTopic"),
			Effect.tapError(logRpcError("createTopic")),
			Effect.catchAll(() => Rpc.err("Internal server error")),
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
