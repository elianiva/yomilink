import type { Edge } from "@xyflow/react";

export interface Proposition {
	source: { id: string; label: string };
	link: { id: string; label: string };
	target: { id: string; label: string };
}

export function composePropositions(
	nodes: Array<{ id: string; type: string; label: string }>,
	edges: Edge[],
): Proposition[] {
	const nodeMap = new Map(nodes.map((node) => [node.id, node]));

	const propositions: Proposition[] = [];

	for (const edge of edges) {
		if (edge.source && edge.target) {
			const sourceNode = nodeMap.get(edge.source);
			const targetNode = nodeMap.get(edge.target);

			if (sourceNode && targetNode) {
				propositions.push({
					source: sourceNode,
					link: { id: edge.source, label: sourceNode.label },
					target: targetNode,
				});
			}
		}
	}

	return propositions;
}
