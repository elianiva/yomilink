import { BaseEdge, type EdgeProps, getStraightPath, useInternalNode } from "@xyflow/react";

import {
	getEdgeParams,
	getQuadraticCurvePoint,
	getQuadraticCurvePath,
} from "../lib/floating-edge-utils";

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
	const badgeT = Math.max(0.2, Math.min(0.8, (data?.badgeT as number) ?? 0.5));
	const useCurvedPath = Boolean(data?.useCurvedPath);

	const [straightPath] = getStraightPath({
		sourceX: sx,
		sourceY: sy,
		targetX: tx,
		targetY: ty,
	});

	const curvedPath = getQuadraticCurvePath({
		sx,
		sy,
		tx,
		ty,
		curveOffset,
	});

	const edgePath = useCurvedPath ? curvedPath : straightPath;
	const badgePoint = useCurvedPath
		? getQuadraticCurvePoint({ sx, sy, tx, ty, curveOffset, t: badgeT })
		: { x: (sx + tx) / 2, y: (sy + ty) / 2 };

	return (
		<>
			<BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
			{badge && (
				<foreignObject
					width={20}
					height={20}
					x={badgePoint.x - 10}
					y={badgePoint.y - 10}
					className="overflow-visible"
				>
					<div className="relative inline-flex items-center justify-center">
						<div
							className="absolute inset-0 rounded-full bg-background border-2"
							style={{
								borderColor: style?.stroke || "#64748b",
							}}
						/>
						<span className="relative z-10 text-[10px] font-bold tabular-nums flex items-center justify-center size-6">
							{badge}
						</span>
					</div>
				</foreignObject>
			)}
		</>
	);
}
