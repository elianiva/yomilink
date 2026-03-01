import type { ConnectionLineComponentProps } from "@xyflow/react";
import { useInternalNode } from "@xyflow/react";

import { getEdgeParamsFromSourceToPoint } from "../lib/floating-edge-utils";

const PREVIEW_COLOR = "oklch(55.2% 0.016 285.938)";

/**
 * Custom connection line that starts from the node boundary
 * rather than a fixed handle position. Shows dashed preview line when dragging.
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
			{/* Dashed preview line */}
			<path
				fill="none"
				stroke={PREVIEW_COLOR}
				strokeWidth={3}
				strokeDasharray="6,4"
				d={`M ${sx},${sy} L ${toX},${toY}`}
			/>
			{/* Target indicator dot */}
			<circle cx={toX} cy={toY} r={5} fill={PREVIEW_COLOR} stroke="#fff" strokeWidth={2} />
		</g>
	);
}
