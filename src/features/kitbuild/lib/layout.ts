import dagre from "dagre";
import type { Edge, Node } from "@/features/learner-map/lib/comparator";

/**
 * Auto-layout nodes using dagre graph layout algorithm
 */
export function getLayoutedElements(
	nodes: Node[],
	edges: Edge[],
	direction = "LR",
): { nodes: Node[]; edges: Edge[] } {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	const nodeWidth = 150;
	const nodeHeight = 50;

	dagreGraph.setGraph({ rankdir: direction });

	for (const node of nodes) {
		dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
	}

	for (const edge of edges) {
		dagreGraph.setEdge(edge.source, edge.target);
	}

	dagre.layout(dagreGraph);

	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		return {
			...node,
			position: {
				x: nodeWithPosition.x - nodeWidth / 2,
				y: nodeWithPosition.y - nodeHeight / 2,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
}
