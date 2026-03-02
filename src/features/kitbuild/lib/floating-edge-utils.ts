import type { InternalNode, Node } from "@xyflow/react";

type NodeWithMeasured = Node & {
	measured?: { width?: number; height?: number };
};

/**
 * Get the center point of a node
 */
function getNodeCenter(node: InternalNode | NodeWithMeasured): {
	x: number;
	y: number;
} {
	const width =
		(node as InternalNode).internals?.positionAbsolute !== undefined
			? ((node as InternalNode).measured?.width ?? 0)
			: ((node as NodeWithMeasured).measured?.width ?? 0);
	const height =
		(node as InternalNode).internals?.positionAbsolute !== undefined
			? ((node as InternalNode).measured?.height ?? 0)
			: ((node as NodeWithMeasured).measured?.height ?? 0);

	const posX = (node as InternalNode).internals?.positionAbsolute?.x ?? node.position.x;
	const posY = (node as InternalNode).internals?.positionAbsolute?.y ?? node.position.y;

	return {
		x: posX + width / 2,
		y: posY + height / 2,
	};
}

/**
 * Calculate the intersection point between a line (from node center to a target point)
 * and the node's rectangular boundary.
 */
function getNodeIntersection(
	node: InternalNode | NodeWithMeasured,
	targetPoint: { x: number; y: number },
): { x: number; y: number } {
	const width =
		(node as InternalNode).internals?.positionAbsolute !== undefined
			? ((node as InternalNode).measured?.width ?? 0)
			: ((node as NodeWithMeasured).measured?.width ?? 0);
	const height =
		(node as InternalNode).internals?.positionAbsolute !== undefined
			? ((node as InternalNode).measured?.height ?? 0)
			: ((node as NodeWithMeasured).measured?.height ?? 0);

	const posX = (node as InternalNode).internals?.positionAbsolute?.x ?? node.position.x;
	const posY = (node as InternalNode).internals?.positionAbsolute?.y ?? node.position.y;

	const nodeCenter = getNodeCenter(node);

	const w = width / 2;
	const h = height / 2;

	const dx = targetPoint.x - nodeCenter.x;
	const dy = targetPoint.y - nodeCenter.y;

	// Handle case where points are the same
	if (dx === 0 && dy === 0) {
		return { x: nodeCenter.x, y: nodeCenter.y - h };
	}

	const slope = Math.abs(dy / dx);
	const nodeSlope = h / w;

	let intersectX: number;
	let intersectY: number;

	if (slope <= nodeSlope) {
		// Intersection is on left or right edge
		intersectX = dx > 0 ? posX + width : posX;
		intersectY = nodeCenter.y + (dy * w) / Math.abs(dx);
	} else {
		// Intersection is on top or bottom edge
		intersectX = nodeCenter.x + (dx * h) / Math.abs(dy);
		intersectY = dy > 0 ? posY + height : posY;
	}

	return { x: intersectX, y: intersectY };
}

/**
 * Get the edge parameters (start and end points) for a floating edge
 * connecting two nodes.
 */
export function getEdgeParams(
	source: InternalNode | NodeWithMeasured,
	target: InternalNode | NodeWithMeasured,
): {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
} {
	const sourceCenter = getNodeCenter(source);
	const targetCenter = getNodeCenter(target);

	const sourceIntersection = getNodeIntersection(source, targetCenter);
	const targetIntersection = getNodeIntersection(target, sourceCenter);

	return {
		sx: sourceIntersection.x,
		sy: sourceIntersection.y,
		tx: targetIntersection.x,
		ty: targetIntersection.y,
	};
}

/**
 * Get floating edge params when one end is a fixed point (used during connection dragging)
 */
export function getEdgeParamsFromSourceToPoint(
	source: InternalNode | NodeWithMeasured,
	targetPoint: { x: number; y: number },
): {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
} {
	const sourceIntersection = getNodeIntersection(source, targetPoint);

	return {
		sx: sourceIntersection.x,
		sy: sourceIntersection.y,
		tx: targetPoint.x,
		ty: targetPoint.y,
	};
}

function getQuadraticControlPoint({
	sx,
	sy,
	tx,
	ty,
	curveOffset,
}: {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	curveOffset: number;
}) {
	const dx = tx - sx;
	const dy = ty - sy;
	const length = Math.sqrt(dx * dx + dy * dy);
	if (length === 0 || curveOffset === 0) {
		return { cx: (sx + tx) / 2, cy: (sy + ty) / 2 };
	}

	const normalX = -dy / length;
	const normalY = dx / length;
	const midpointX = (sx + tx) / 2;
	const midpointY = (sy + ty) / 2;
	const maxOffset = Math.max(12, length * 0.35);
	const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, curveOffset));

	return {
		cx: midpointX + normalX * clampedOffset,
		cy: midpointY + normalY * clampedOffset,
	};
}

export function getQuadraticCurvePath({
	sx,
	sy,
	tx,
	ty,
	curveOffset,
}: {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	curveOffset: number;
}) {
	const { cx, cy } = getQuadraticControlPoint({ sx, sy, tx, ty, curveOffset });
	return `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;
}

export function getQuadraticCurvePoint({
	sx,
	sy,
	tx,
	ty,
	curveOffset,
	t,
}: {
	sx: number;
	sy: number;
	tx: number;
	ty: number;
	curveOffset: number;
	t: number;
}) {
	const { cx, cy } = getQuadraticControlPoint({ sx, sy, tx, ty, curveOffset });
	const oneMinusT = 1 - t;

	return {
		x: oneMinusT * oneMinusT * sx + 2 * oneMinusT * t * cx + t * t * tx,
		y: oneMinusT * oneMinusT * sy + 2 * oneMinusT * t * cy + t * t * ty,
	};
}
