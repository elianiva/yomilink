import { Effect, Schema } from "effect";
import type { Edge, Node, Proposition } from "@/lib/learnermap-comparator";

export const DetailedComparisonSchema = Schema.Struct({
	match: Schema.Array(Schema.Any),
	miss: Schema.Array(Schema.Any),
	excessive: Schema.Array(Schema.Any),
	leave: Schema.Array(Schema.Any),
	abandon: Schema.Array(Schema.Any),
	propositions: Schema.Struct({
		match: Schema.Array(Schema.Any),
		miss: Schema.Array(Schema.Any),
		excessive: Schema.Array(Schema.Any),
	}),
	score: Schema.Number,
	totalGoalEdges: Schema.Number,
});

export type DetailedComparison = Schema.Schema.Type<
	typeof DetailedComparisonSchema
>;

function resolveNodeLabel(
	nodeId: string,
	nodes: Node[],
): { id: string; label: string } {
	const node = nodes.find((n) => n.id === nodeId);
	return {
		id: nodeId,
		label: (node?.data as { label?: string })?.label || nodeId,
	};
}

export function compareMapsDetailed(
	goalMapEdges: Edge[],
	goalMapNodes: Node[],
	learnerEdges: Edge[],
	learnerNodes: Node[],
): Effect.Effect<DetailedComparison, never> {
	return Effect.gen(function* () {
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
					const sourceNode = resolveNodeLabel(edge.source, learnerNodes);
					const targetNode = resolveNodeLabel(edge.target, learnerNodes);
					const linkNode = sourceNode;

					matchProps.push({
						source: sourceNode,
						link: linkNode,
						target: targetNode,
					});
				} else {
					excessive.push(edge);
					const sourceNode = resolveNodeLabel(edge.source, learnerNodes);
					const targetNode = resolveNodeLabel(edge.target, learnerNodes);
					const linkNode = sourceNode;

					excessiveProps.push({
						source: sourceNode,
						link: linkNode,
						target: targetNode,
					});
				}
			} else {
				// Edge not in goal map - excessive
				excessive.push(edge);
				const sourceNode = resolveNodeLabel(edge.source, learnerNodes);
				const targetNode = resolveNodeLabel(edge.target, learnerNodes);
				const linkNode = sourceNode;

				excessiveProps.push({
					source: sourceNode,
					link: linkNode,
					target: targetNode,
				});
			}
		}

		// Find missing edges
		for (const edge of goalMapEdges) {
			const key = `${edge.source}-${edge.target}`;
			if (!learnerMapSet.has(key)) {
				const sourceNode = resolveNodeLabel(edge.source, goalMapNodes);
				const targetNode = resolveNodeLabel(edge.target, goalMapNodes);
				miss.push({
					...edge,
					id: `missing-${edge.id}`,
				});
				missProps.push({
					source: sourceNode,
					link: sourceNode,
					target: targetNode,
				});
			}
		}

		// Find abandoned goal concepts (goal edges whose nodes not used by any learner edge)
		// Only check for abandon if learner has edges
		if (learnerEdges.length > 0) {
			const usedLearnerNodes = new Set([
				...learnerEdges.map((e) => e.source),
				...learnerEdges.map((e) => e.target),
			]);

			for (const edge of goalMapEdges) {
				// Abandon: edge's nodes are completely disconnected from learner
				if (
					!usedLearnerNodes.has(edge.source) &&
					!usedLearnerNodes.has(edge.target)
				) {
					abandon.push(edge);
				}
			}
		}

		// Find leave opportunities (goal edges not used by learner but whose nodes are used)
		for (const edge of goalMapEdges) {
			const isMissing = miss.some((e) => e.id === `missing-${edge.id}`);
			const isAbandon = abandon.some((e) => e.id === edge.id);
			// Leave: edge is missing (not in learner) but not abandon (nodes are used or no learner)
			if (isMissing && !isAbandon) {
				leave.push(edge);
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
				miss: missProps,
				excessive: excessiveProps,
			},
			score,
			totalGoalEdges: goalMapEdges.length,
		};
	});
}
