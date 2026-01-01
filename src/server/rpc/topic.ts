import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { Effect, Layer, Schema } from "effect";
import { authMiddleware } from "@/middlewares/auth";
import {
	listTopics,
	createTopic,
	CreateTopicInput,
} from "@/features/analyzer/lib/topic-service";
import { DatabaseLive } from "../db/client";
import { LoggerLive } from "../logger";
import { logRpcError } from "./handler";

export const listTopicsRpc = createServerFn()
	.middleware([authMiddleware])
	.handler(() =>
		listTopics().pipe(
			Effect.tapError(logRpcError("listTopics")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("listTopics"),
			Effect.runPromise,
		),
	);

export const createTopicRpc = createServerFn()
	.middleware([authMiddleware])
	.inputValidator((raw) => Schema.decodeUnknownSync(CreateTopicInput)(raw))
	.handler(({ data }) =>
		createTopic(data).pipe(
			Effect.tapError(logRpcError("createTopic")),
			Effect.provide(Layer.mergeAll(DatabaseLive, LoggerLive)),
			Effect.withSpan("createTopic"),
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
