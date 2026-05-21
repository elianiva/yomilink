import { Match, Schema } from "effect";

export const NodeSchema = Schema.Struct({
	id: Schema.String,
	data: Schema.Any,
	position: Schema.Struct({
		x: Schema.Number,
		y: Schema.Number,
	}),
	type: Schema.optional(Schema.String),
	selected: Schema.optional(Schema.Boolean),
});

export type Node = Schema.Schema.Type<typeof NodeSchema>;

export const EdgeSchema = Schema.Struct({
	id: Schema.String,
	source: Schema.String,
	target: Schema.String,
	sourceHandle: Schema.optional(Schema.NullOr(Schema.String)),
	targetHandle: Schema.optional(Schema.NullOr(Schema.String)),
	type: Schema.optional(Schema.String),
	data: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Any })),
	animated: Schema.optional(Schema.Boolean),
	style: Schema.optional(
		Schema.Struct({
			strokeDasharray: Schema.optional(Schema.String),
			opacity: Schema.optional(Schema.Number),
			stroke: Schema.optional(Schema.String),
			strokeWidth: Schema.optional(Schema.Number),
		}),
	),
	selected: Schema.optional(Schema.Boolean),
});

export type Edge = Schema.Schema.Type<typeof EdgeSchema>;

export const PropositionTripleSchema = Schema.Struct({
	sourceId: Schema.String,
	linkId: Schema.String,
	targetId: Schema.String,
});

export type PropositionTriple = typeof PropositionTripleSchema.Type;

export interface DiagnosisResult {
	correct: PropositionTriple[];
	missing: PropositionTriple[];
	excessive: PropositionTriple[];
	score: number;
	totalGoalPropositions: number;
}

function composePropositionTriples(
	nodes: Readonly<Node[]>,
	edges: Readonly<Edge[]>,
): PropositionTriple[] {
	const conceptIds = new Set(
		nodes.filter((n) => n.type === "text" || n.type === "image").map((n) => n.id),
	);
	const connectorIds = new Set(nodes.filter((n) => n.type === "connector").map((n) => n.id));

	const triples: PropositionTriple[] = [];

	for (const connectorId of connectorIds) {
		const inbound = edges.filter((e) => e.target === connectorId);
		const outbound = edges.filter((e) => e.source === connectorId);

		for (const inEdge of inbound) {
			if (!conceptIds.has(inEdge.source)) continue;
			for (const outEdge of outbound) {
				if (!conceptIds.has(outEdge.target)) continue;
				triples.push({
					sourceId: inEdge.source,
					linkId: connectorId,
					targetId: outEdge.target,
				});
			}
		}
	}

	return triples;
}

function tripleKey(t: PropositionTriple): string {
	return `${t.sourceId}|${t.linkId}|${t.targetId}`;
}

export function compareMaps(
	goalNodes: Readonly<Node[]>,
	goalEdges: Readonly<Edge[]>,
	learnerNodes: Readonly<Node[]>,
	learnerEdges: Readonly<Edge[]>,
): DiagnosisResult {
	const goalPropositions = composePropositionTriples(goalNodes, goalEdges);
	const learnerPropositions = composePropositionTriples(learnerNodes, learnerEdges);

	const learnerSet = new Set(learnerPropositions.map(tripleKey));
	const goalSet = new Set(goalPropositions.map(tripleKey));

	const correct = goalPropositions.filter((p) => learnerSet.has(tripleKey(p)));
	const missing = goalPropositions.filter((p) => !learnerSet.has(tripleKey(p)));
	const excessive = learnerPropositions.filter((p) => !goalSet.has(tripleKey(p)));

	const score =
		goalPropositions.length > 0
			? Math.round((correct.length / goalPropositions.length) * 100) / 100
			: 1;

	return {
		correct,
		missing,
		excessive,
		score,
		totalGoalPropositions: goalPropositions.length,
	};
}

export interface EdgeClassification {
	edge: Edge;
	type: "correct" | "missing" | "excessive" | "neutral";
}

export const EdgeClassificationSchema = Schema.Struct({
	edge: EdgeSchema,
	type: Schema.Literal("correct", "missing", "excessive"),
});

function edgeKey(source: string, target: string): string {
	const [a, b] = source < target ? [source, target] : [target, source];
	return `${a}|${b}`;
}

export function classifyEdges(
	goalMapEdges: Readonly<Edge[]>,
	learnerEdges: Readonly<Edge[]>,
): EdgeClassification[] {
	const goalSet = new Set(goalMapEdges.map((e) => edgeKey(e.source, e.target)));
	const learnerSet = new Set(learnerEdges.map((e) => edgeKey(e.source, e.target)));

	const missing = goalMapEdges.filter((e) => !learnerSet.has(edgeKey(e.source, e.target)));
	const excessiveSet = new Set(
		learnerEdges
			.filter((e) => !goalSet.has(edgeKey(e.source, e.target)))
			.map((e) => edgeKey(e.source, e.target)),
	);

	const learnerClassifications: EdgeClassification[] = learnerEdges.map((edge) => ({
		edge,
		type: excessiveSet.has(edgeKey(edge.source, edge.target)) ? "excessive" : "correct",
	}));

	const missingClassifications: EdgeClassification[] = missing.map((m) => ({
		edge: {
			id: `missing-${m.source}-${m.target}`,
			source: m.source,
			target: m.target,
			animated: true,
			style: { strokeDasharray: "5,5", opacity: 0.5 },
		},
		type: "missing" as const,
	}));

	return [...learnerClassifications, ...missingClassifications];
}

export function getEdgeStyleByType(type: "correct" | "missing" | "excessive") {
	return Match.value(type).pipe(
		Match.when("correct", () => ({
			stroke: "#22c55e",
			strokeWidth: 3,
		})),
		Match.when("excessive", () => ({
			stroke: "#ef4444",
			strokeWidth: 3,
		})),
		Match.when("missing", () => ({
			stroke: "#f59e0b",
			strokeWidth: 2,
			strokeDasharray: "5,5",
			opacity: 0.7,
		})),
		Match.exhaustive,
	);
}
