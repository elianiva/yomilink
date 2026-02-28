import type { ConnectionLineComponentProps } from "@xyflow/react";
import { useInternalNode } from "@xyflow/react";

import { getEdgeParamsFromSourceToPoint } from "../lib/floating-edge-utils";

/**
 * Custom connection line that starts from the node boundary
 * rather than a fixed handle position.
 */
export function FloatingConnectionLine({ toX, toY, fromNode }: ConnectionLineComponentProps) {
	const sourceNode = useInternalNode(fromNode?.id ?? "");

	if (!sourceNode) {
		return null;
	}

	const { sx, sy } = getEdgeParamsFromSourceToPoint(sourceNode, {
		x: toX,
		y: toY,
	});

	return (
		<g>
			<path
				fill="none"
				stroke="#16a34a"
				strokeWidth={3}
				d={`M ${sx},${sy} L ${toX},${toY}`}
			/>
			<circle cx={toX} cy={toY} r={4} fill="#16a34a" stroke="#16a34a" strokeWidth={1.5} />
		</g>
	);
}
