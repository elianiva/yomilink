import { useMemo } from "react";

import type { Node } from "@/features/learner-map/lib/comparator";

export function useAnalyticsNodes({
	goalNodes,
	learnerMaps,
}: {
	goalNodes: ReadonlyArray<Node>;
	learnerMaps: ReadonlyArray<{
		nodes: ReadonlyArray<Node>;
	}>;
}) {
	return useMemo(() => {
		const nodeMap = new Map<string, Node>();

		for (const node of goalNodes) {
			nodeMap.set(node.id, {
				...node,
				data: {
					...node.data,
				},
			});
		}

		for (const learnerMap of learnerMaps) {
			for (const node of learnerMap.nodes) {
				const existingNode = nodeMap.get(node.id);
				if (existingNode) {
					nodeMap.set(node.id, {
						...node,
						position: existingNode.position,
					});
					continue;
				}
				nodeMap.set(node.id, node);
			}
		}

		return Array.from(nodeMap.values());
	}, [goalNodes, learnerMaps]);
}
