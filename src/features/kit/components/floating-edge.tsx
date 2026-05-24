import {
	BaseEdge,
	type EdgeProps,
	getStraightPath,
	useInternalNode,
	useReactFlow,
} from "@xyflow/react";

import {
	Tooltip,
	TooltipArrow,
	TooltipPortal,
	TooltipPopup,
	TooltipPositioner,
	TooltipTrigger,
	TooltipViewport,
	createTooltipHandle,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
	getEdgeParams,
	getQuadraticCurvePoint,
	getQuadraticCurvePath,
} from "../lib/floating-edge-utils";

type FloatingEdgeData = Record<string, unknown> & {
	badge?: string;
	curveOffset?: number;
	badgeT?: number;
	useCurvedPath?: boolean;
	createdBy?: string;
	showNamesOnHover?: boolean;
	pulseOpacity?: boolean;
};

/**
 * A custom edge that connects to the closest point on the node boundary
 * rather than fixed handle positions.
 */
export function FloatingEdge({ id, source, target, selected, markerEnd, style, data }: EdgeProps) {
	const sourceNode = useInternalNode(source);
	const targetNode = useInternalNode(target);
	const { deleteElements } = useReactFlow();
	const tooltipHandle = createTooltipHandle();
	const edgeData = data as FloatingEdgeData | undefined;

	if (!sourceNode || !targetNode) {
		return null;
	}

	const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode);

	const badge = edgeData?.badge;
	const curveOffset = edgeData?.curveOffset ?? 0;
	const badgeT = Math.max(0.2, Math.min(0.8, edgeData?.badgeT ?? 0.5));
	const useCurvedPath = Boolean(edgeData?.useCurvedPath);
	const pulseOpacity = Boolean(edgeData?.pulseOpacity);
	const createdByRaw = edgeData?.createdBy;
	const createdBy = createdByRaw
		?.split("\n")
		.reduce<string[]>((acc, name) => {
			const trimmed = name.trim();
			if (trimmed && !acc.includes(trimmed)) acc.push(trimmed);
			return acc;
		}, [])
		.join("\n");
	const showNamesOnHover = Boolean(edgeData?.showNamesOnHover);

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
		<g className={cn(pulseOpacity && "edge-pulse")}>
			<BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
			{badge && (
				<foreignObject
					width={20}
					height={20}
					x={badgePoint.x - 10}
					y={badgePoint.y - 10}
					className="overflow-visible"
				>
					{createdBy && showNamesOnHover ? (
						<Tooltip handle={tooltipHandle}>
							<div className="relative inline-flex items-center justify-center pointer-events-auto">
								<TooltipTrigger
									handle={tooltipHandle}
									delay={50}
									className="relative z-10 text-[10px] font-bold tabular-nums flex items-center justify-center size-6 cursor-pointer rounded-full hover:border-2 hover:border-primary"
								>
									{badge}
								</TooltipTrigger>
								<div
									className="absolute inset-0 rounded-full bg-background border-2 -z-10"
									style={{
										borderColor: style?.stroke || "#64748b",
									}}
								/>
							</div>
							<TooltipPortal>
								<TooltipPositioner sideOffset={4}>
									<TooltipPopup>
										<TooltipArrow />
										<TooltipViewport className="whitespace-pre-line">
											{createdBy}
										</TooltipViewport>
									</TooltipPopup>
								</TooltipPositioner>
							</TooltipPortal>
						</Tooltip>
					) : (
						<div className="relative inline-flex items-center justify-center">
							<span className="relative z-10 text-[10px] font-bold tabular-nums flex items-center justify-center size-6">
								{badge}
							</span>
							<div
								className="absolute inset-0 rounded-full bg-background border-2"
								style={{
									borderColor: style?.stroke || "#64748b",
								}}
							/>
						</div>
					)}
				</foreignObject>
			)}
			{selected && (
				<foreignObject
					width={24}
					height={24}
					x={badgePoint.x - 12}
					y={badgePoint.y - 16}
					className="overflow-visible"
				>
					<button
						type="button"
						className="flex items-center justify-center size-6 rounded-full bg-background text-destructive border-2 border-destructive text-xs font-semibold shadow-md cursor-pointer"
						onClick={() => deleteElements({ edges: [{ id }] })}
					>
						×
					</button>
				</foreignObject>
			)}
		</g>
	);
}
