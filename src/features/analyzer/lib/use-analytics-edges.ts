import type { Edge } from "@xyflow/react";
import { useMemo } from "react";

type EdgeClassificationType = "correct" | "missing" | "excessive" | "neutral";

type EdgeClassification = {
	edge: Edge;
	type: EdgeClassificationType;
	createdBy?: string;
};

type Visibility = {
	showGoalMap: boolean;
	showLearnerMap: boolean;
	showCorrectEdges: boolean;
	showMissingEdges: boolean;
	showExcessiveEdges: boolean;
	showNeutralEdges: boolean;
	consolidatedView: boolean;
	showNamesOnHover: boolean;
};

function getEdgeStyleByType(type: EdgeClassificationType) {
	switch (type) {
		case "correct":
			return {
				stroke: "var(--edge-correct)",
				strokeWidth: 3,
			};
		case "excessive":
			return {
				stroke: "var(--edge-excessive)",
				strokeWidth: 3,
				strokeDasharray: "5,5",
			};
		case "missing":
			return {
				stroke: "var(--edge-missing)",
				strokeWidth: 2,
				strokeDasharray: "5,5",
			};
		case "neutral":
			return {
				stroke: "var(--edge-neutral)",
				strokeWidth: 2,
			};
	}
}

function getSymmetricCurveOffset(index: number, total: number, gap = 44) {
	if (total <= 1) return 0;
	return (index - (total - 1) / 2) * gap;
}

function getBadgeT(index: number, total: number) {
	if (total <= 1) return 0.5;
	const centered = index - (total - 1) / 2;
	return Math.max(0.3, Math.min(0.7, 0.5 + centered * 0.08));
}

function isTypeVisible(type: EdgeClassificationType, visibility: Visibility) {
	switch (type) {
		case "correct":
			return visibility.showCorrectEdges;
		case "missing":
			return visibility.showMissingEdges;
		case "excessive":
			return visibility.showExcessiveEdges;
		case "neutral":
			return visibility.showNeutralEdges;
	}
}

const edgeKeyFor = (edge: Pick<Edge, "source" | "target">) =>
	JSON.stringify([edge.source, edge.target]);

export function useAnalyticsEdges({
	goalEdges,
	currentLearnerMaps,
	currentEdgeClassifications,
	visibility,
	isMultiView,
}: {
	goalEdges: ReadonlyArray<Edge>;
	currentLearnerMaps: ReadonlyArray<{ userName: string }>;
	currentEdgeClassifications: ReadonlyArray<EdgeClassification>;
	visibility: Visibility;
	isMultiView?: boolean;
}) {
	return useMemo(() => {
		const edgesToDisplay: Edge[] = [];
		const { showGoalMap, showLearnerMap, consolidatedView, showNamesOnHover } = visibility;

		if (showGoalMap && showLearnerMap) {
			if (isMultiView) {
				if (consolidatedView) {
					const edgeData = new Map<
						string,
						{
							correct: { count: number; creators: Set<string> };
							missing: { count: number; creators: Set<string> };
							excessive: { count: number; creators: Set<string> };
							neutral: { count: number; creators: Set<string> };
						}
					>();

					for (const classification of currentEdgeClassifications) {
						const key = edgeKeyFor(classification.edge);
						const data = edgeData.get(key) || {
							correct: { count: 0, creators: new Set<string>() },
							missing: { count: 0, creators: new Set<string>() },
							excessive: { count: 0, creators: new Set<string>() },
							neutral: { count: 0, creators: new Set<string>() },
						};
						data[classification.type].count++;
						if (classification.createdBy) {
							data[classification.type].creators.add(classification.createdBy);
						}
						edgeData.set(key, data);
					}

					for (const [key, data] of edgeData.entries()) {
						const [source, target] = JSON.parse(key) as [string, string];
						const types: EdgeClassificationType[] = [
							"correct",
							"missing",
							"excessive",
							"neutral",
						];
						const visibleTypes = types.filter(
							(type) => data[type].count > 0 && isTypeVisible(type, visibility),
						);

						for (const [index, type] of visibleTypes.entries()) {
							const style = getEdgeStyleByType(type);
							const creatorList = Array.from(data[type].creators).sort().join("\n");
							edgesToDisplay.push({
								id: `${key}-${type}`,
								source,
								target,
								type: "floating",
								style,
								animated: type === "missing",
								markerEnd: {
									type: "arrowclosed",
									color: style.stroke,
								},
								data: {
									badge: data[type].count.toString(),
									curveOffset: getSymmetricCurveOffset(
										index,
										visibleTypes.length,
									),
									badgeT: getBadgeT(index, visibleTypes.length),
									useCurvedPath: true,
									createdBy: creatorList || undefined,
									showNamesOnHover,
								},
							});
						}
					}
				} else {
					const edgeGroups = new Map<string, EdgeClassification[]>();

					for (const classification of currentEdgeClassifications) {
						if (!isTypeVisible(classification.type, visibility)) continue;

						const key = `${edgeKeyFor(classification.edge)}-${classification.type}`;
						const group = edgeGroups.get(key) || [];
						group.push(classification);
						edgeGroups.set(key, group);
					}

					for (const [key, group] of edgeGroups.entries()) {
						for (const [index, classification] of group.entries()) {
							const style = getEdgeStyleByType(classification.type);
							edgesToDisplay.push({
								id: `${key}-${index}`,
								source: classification.edge.source,
								target: classification.edge.target,
								sourceHandle: "right",
								targetHandle: "left",
								type: "floating",
								style,
								animated: classification.type === "missing",
								markerEnd: {
									type: "arrowclosed",
									color: style.stroke,
								},
								data: {
									curveOffset: getSymmetricCurveOffset(index, group.length),
									useCurvedPath: true,
									createdBy: classification.createdBy || undefined,
									showNamesOnHover,
								},
							});
						}
					}
				}
			} else {
				for (const classification of currentEdgeClassifications) {
					if (!isTypeVisible(classification.type, visibility)) continue;

					const style = getEdgeStyleByType(classification.type);
					edgesToDisplay.push({
						...classification.edge,
						sourceHandle: "right",
						targetHandle: "left",
						type: "floating",
						style,
						animated: classification.type === "missing",
						markerEnd: {
							type: "arrowclosed",
							color: style.stroke,
						},
						data: {
							...classification.edge.data,
							createdBy: classification.createdBy ?? currentLearnerMaps[0]?.userName,
							showNamesOnHover,
						},
					});
				}
			}
		} else if (showGoalMap) {
			for (const edge of goalEdges) {
				edgesToDisplay.push({
					...edge,
					sourceHandle: "right",
					targetHandle: "left",
					type: "floating",
					style: {
						stroke: "var(--edge-neutral)",
						strokeWidth: 2,
					},
					markerEnd: {
						type: "arrowclosed",
						color: "var(--edge-neutral)",
					},
				});
			}
		} else if (showLearnerMap) {
			if (isMultiView) {
				if (consolidatedView) {
					const edgeData = new Map<
						string,
						{
							correct: { count: number; creators: Set<string> };
							excessive: { count: number; creators: Set<string> };
							neutral: { count: number; creators: Set<string> };
						}
					>();

					for (const classification of currentEdgeClassifications) {
						if (classification.type === "missing") continue;

						const key = edgeKeyFor(classification.edge);
						const data = edgeData.get(key) || {
							correct: { count: 0, creators: new Set<string>() },
							excessive: { count: 0, creators: new Set<string>() },
							neutral: { count: 0, creators: new Set<string>() },
						};
						const type = classification.type as "correct" | "excessive" | "neutral";
						data[type].count++;
						if (classification.createdBy) {
							data[type].creators.add(classification.createdBy);
						}
						edgeData.set(key, data);
					}

					for (const [key, data] of edgeData.entries()) {
						const [source, target] = JSON.parse(key) as [string, string];
						const types: Array<"correct" | "excessive" | "neutral"> = [
							"correct",
							"excessive",
							"neutral",
						];
						const visibleTypes = types.filter(
							(type) => data[type].count > 0 && isTypeVisible(type, visibility),
						);

						for (const [index, type] of visibleTypes.entries()) {
							const style = getEdgeStyleByType(type);
							const creatorList = Array.from(data[type].creators).sort().join("\n");
							edgesToDisplay.push({
								id: `${key}-${type}`,
								source,
								target,
								sourceHandle: "right",
								targetHandle: "left",
								type: "floating",
								style,
								markerEnd: {
									type: "arrowclosed",
									color: style.stroke,
								},
								data: {
									badge: data[type].count.toString(),
									curveOffset: getSymmetricCurveOffset(
										index,
										visibleTypes.length,
									),
									badgeT: getBadgeT(index, visibleTypes.length),
									useCurvedPath: true,
									createdBy: creatorList || undefined,
									showNamesOnHover,
								},
							});
						}
					}
				} else {
					const edgeGroups = new Map<string, EdgeClassification[]>();

					for (const classification of currentEdgeClassifications) {
						if (classification.type === "missing") continue;
						if (!isTypeVisible(classification.type, visibility)) continue;

						const key = `${edgeKeyFor(classification.edge)}-${classification.type}`;
						const group = edgeGroups.get(key) || [];
						group.push(classification);
						edgeGroups.set(key, group);
					}

					for (const [key, group] of edgeGroups.entries()) {
						for (const [index, classification] of group.entries()) {
							const style = getEdgeStyleByType(classification.type);
							edgesToDisplay.push({
								id: `${key}-${index}`,
								source: classification.edge.source,
								target: classification.edge.target,
								sourceHandle: "right",
								targetHandle: "left",
								type: "floating",
								style,
								markerEnd: {
									type: "arrowclosed",
									color: style.stroke,
								},
								data: {
									curveOffset: getSymmetricCurveOffset(index, group.length),
									useCurvedPath: true,
									createdBy: classification.createdBy || undefined,
									showNamesOnHover,
								},
							});
						}
					}
				}
			} else {
				for (const classification of currentEdgeClassifications) {
					if (classification.type === "missing") continue;
					if (!isTypeVisible(classification.type, visibility)) continue;

					const style = getEdgeStyleByType(classification.type);
					edgesToDisplay.push({
						...classification.edge,
						sourceHandle: "right",
						targetHandle: "left",
						type: "floating",
						style,
						markerEnd: {
							type: "arrowclosed",
							color: style.stroke,
						},
						data: {
							...classification.edge.data,
							createdBy: classification.createdBy ?? currentLearnerMaps[0]?.userName,
							showNamesOnHover,
						},
					});
				}
			}
		}

		return edgesToDisplay;
	}, [goalEdges, currentLearnerMaps, currentEdgeClassifications, visibility, isMultiView]);
}
