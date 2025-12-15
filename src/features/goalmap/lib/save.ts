import type { Edge, Node } from "@xyflow/react";
import { Data, Effect } from "effect";
import type { ConnectorNodeData } from "../components/connector-node";
import type { ImageNodeData } from "../components/ImageNode";
import type { TextNodeData } from "../components/TextNode";
import { saveGoalMap } from "@/server/rpc/goal-map";

export type AnyNode = Node<TextNodeData | ImageNodeData | ConnectorNodeData>;

// Effect error types for save operation
export class SaveError extends Data.TaggedError("SaveError")<{
	message: string;
}> {}

export class AuthError extends Data.TaggedError("AuthError")<{
	message: string;
}> {}

export interface SaveParams {
	goalMapId: string;
	title: string;
	description: string;
	nodes: AnyNode[];
	edges: Edge[];
}

// Effect-based save operation
export const saveGoalMapEffect = (params: SaveParams) =>
	Effect.tryPromise({
		try: () =>
			saveGoalMap({
				data: {
					goalMapId: params.goalMapId,
					title: params.title,
					description: params.description || undefined,
					nodes: params.nodes,
					edges: params.edges,
				},
			}),
		catch: (error) => {
			const message =
				error instanceof Error
					? error.message
					: "Save failed. Please try again.";
			if (/unauthorized|forbidden/i.test(message)) {
				return new AuthError({ message });
			}
			return new SaveError({ message });
		},
	});

export const saveToLocalStorage = (params: SaveParams) =>
	Effect.try({
		try: () => {
			const localDoc = {
				goalMapId: params.goalMapId,
				title: params.title,
				description: params.description,
				nodes: params.nodes,
				edges: params.edges,
				updatedAt: Date.now(),
			};
			localStorage.setItem(
				`goalmap:${params.goalMapId}`,
				JSON.stringify(localDoc),
			);
			return { isLocalFallback: true as const };
		},
		catch: () => new SaveError({ message: "Failed to save locally" }),
	});
