import { BaseEdge, type EdgeProps, getStraightPath, useInternalNode } from "@xyflow/react";

import { getEdgeParams } from "../lib/floating-edge-utils";

/**
 * A custom edge that connects to the closest point on the node boundary
 * rather than fixed handle positions.
 */
export function FloatingEdge({ id, source, target, markerEnd, style, data }: EdgeProps) {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);

	if (!sourceNode || !targetNode) {
		return null;
	}

	const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

	const badge = data?.badge as string | undefined;
	const curveOffset = (data?.curveOffset as number) ?? 0;

	// Calculate offset positions for multi-view edges
	let offsetX = 0;
	let offsetY = 0;
	if (curveOffset !== 0) {
		const dx = tx - sx;
		const dy = ty - sy;
		const length = Math.sqrt(dx * dx + dy * dy);
		if (length > 0) {
			// Calculate perpendicular offset
			offsetX = (-dy / length) * curveOffset * 0.3;
			offsetY = (dx / length) * curveOffset * 0.3;
		}
	}

	const [edgePath] = getStraightPath({
		sourceX: sx + offsetX,
		sourceY: sy + offsetY,
		targetX: tx + offsetX,
		targetY: ty + offsetY,
	});

	return (
		<>
			<BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
			{badge && (
				<foreignObject
					width={20}
					height={20}
					x={(sx + tx) / 2 + offsetX - 10}
					y={(sy + ty) / 2 + offsetY - 10}
					className="overflow-visible"
				>
					<div className="relative inline-flex items-center justify-center">
						<div
							className="absolute inset-0 rounded-full bg-background border-2"
							style={{
								borderColor: style?.stroke || "#64748b",
							}}
						/>
						<span className="relative z-10 text-[10px] font-bold tabular-nums">
							{badge}
						</span>
					</div>
				</foreignObject>
			)}
		</>
	);
}
