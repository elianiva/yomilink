import {
	BaseEdge,
	type EdgeProps,
	getStraightPath,
	useInternalNode,
} from "@xyflow/react";
import { getEdgeParams } from "../lib/floating-edge-utils";

/**
 * A custom edge that connects to the closest point on the node boundary
 * rather than fixed handle positions.
 */
export function FloatingEdge({
	id,
	source,
	target,
	markerEnd,
	style,
}: EdgeProps) {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);

	if (!sourceNode || !targetNode) {
		return null;
	}

	const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

	const [edgePath] = getStraightPath({
		sourceX: sx,
		sourceY: sy,
		targetX: tx,
		targetY: ty,
	});

	return (
		<BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
	);
}
