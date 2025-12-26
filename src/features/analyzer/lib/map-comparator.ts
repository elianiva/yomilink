import type { Edge } from "@xyflow/react";

export interface DetailedComparison {
	match: Edge[];
	miss: Edge[];
	excessive: Edge[];
	leave: Edge[];
	abandon: Edge[];
	propositions: {
		match: Proposition[];
		miss: Proposition[];
		excessive: Proposition[];
	};
	score: number;
	totalGoalEdges: number;
}

export interface Proposition {
	source: { id: string; label: string };
	link: { id: string; label: string };
	target: { id: string; label: string };
}

export function compareMapsDetailed(
	goalMapEdges: Edge[],
	learnerEdges: Edge[],
	direction: "bi" | "uni" | "multi",
): DetailedComparison {
	const goalMapSet = new Set(
		goalMapEdges.map((e) => `${e.source}-${e.target}`),
	);
	const learnerMapSet = new Set(
		learnerEdges.map((e) => `${e.source}-${e.target}`),
	);

	const match: Edge[] = [];
	const miss: Edge[] = [];
	const excessive: Edge[] = [];
	const leave: Edge[] = [];
	const abandon: Edge[] = [];

	const matchProps: Proposition[] = [];
	const missProps: Proposition[] = [];
	const excessiveProps: Proposition[] = [];

	const usedLearnerEdges = new Set(learnerEdges.map((e) => e.id));

	// Find matching edges
	for (const edge of learnerEdges) {
		const key = `${edge.source}-${edge.target}`;
		if (goalMapSet.has(key)) {
			const goalEdge = goalMapEdges.find(
				(e) => `${e.source}-${e.target}` === key,
			);
			if (goalEdge) {
				match.push(edge);
				// Add to match propositions
				const sourceNode = goalEdge.source;
				const targetNode = goalEdge.target;
				const linkNode = edge.source;

				if (sourceNode && targetNode && linkNode) {
					matchProps.push({
						source: { id: sourceNode.id, label: sourceNode.label },
						link: { id: linkNode.id, label: linkNode.label },
						target: { id: targetNode.id, label: targetNode.label },
					});
				}
			} else {
				excessive.push(edge);
				const sourceNode = edge.source;
				const linkNode = edge.source;
				const targetNode = edge.target;

				if (sourceNode && targetNode && linkNode) {
					excessiveProps.push({
						source: { id: sourceNode.id, label: sourceNode.label },
						link: { id: linkNode.id, label: linkNode.label },
						target: { id: targetNode.id, label: targetNode.label },
					});
				}
			}
		}
	}

	// Find missing edges
	for (const edge of goalMapEdges) {
		const key = `${edge.source}-${edge.target}`;
		if (!learnerMapSet.has(key)) {
			miss.push({
				...edge,
				id: `missing-${edge.id}`,
			});
		}
	}

	// Find leave opportunities (goal edges not used by learner)
	const usedGoalSources = new Set(match.map((e) => e.source));
	const usedGoalTargets = new Set(match.map((e) => e.target));

	for (const edge of goalMapEdges) {
		if (
			!usedGoalSources.has(edge.source) ||
			!usedGoalTargets.has(edge.target)
		) {
			leave.push(edge);
		}
	}

	// Find abandoned goal concepts (goal nodes not connected to any learner edge)
	const usedLearnerSources = new Set(learnerEdges.map((e) => e.source));
	const usedLearnerTargets = new Set(learnerEdges.map((e) => e.target));

	for (const edge of goalMapEdges) {
		if (
			!usedLearnerSources.has(edge.source) &&
			!usedLearnerTargets.has(edge.target)
		) {
			abandon.push(edge);
		}
	}

	const score =
		goalMapEdges.length > 0 ? match.length / goalMapEdges.length : 1;

	return {
		match,
		miss,
		excessive,
		leave,
		abandon,
		propositions: {
			match: matchProps,
			miss: missProps.map((e) => ({
				source: e.source,
				link: { id: e.source, label: e.source },
				target: e.target,
			})),
			excessive: excessiveProps,
		},
		score,
		totalGoalEdges: goalMapEdges.length,
	};
}
