import { Effect, Match, Schema } from "effect";

export const NodeSchema = Schema.Struct({
	id: Schema.String,
	data: Schema.optional(Schema.Any),
	position: Schema.optional(
		Schema.Struct({
			x: Schema.Number,
			y: Schema.Number,
		}),
	),
	type: Schema.optional(Schema.String),
});

export type Node = Schema.Schema.Type<typeof NodeSchema>;

export const EdgeSchema = Schema.Struct({
	id: Schema.String,
	source: Schema.String,
	target: Schema.String,
	sourceHandle: Schema.optional(Schema.NullOr(Schema.String)),
	targetHandle: Schema.optional(Schema.NullOr(Schema.String)),
	type: Schema.optional(Schema.String),
	data: Schema.optional(
		Schema.Record({ key: Schema.String, value: Schema.Any }),
	),
	animated: Schema.optional(Schema.Boolean),
	style: Schema.optional(
		Schema.Struct({
			strokeDasharray: Schema.optional(Schema.String),
			opacity: Schema.optional(Schema.Number),
			stroke: Schema.optional(Schema.String),
			strokeWidth: Schema.optional(Schema.Number),
		}),
	),
});

export type Edge = Schema.Schema.Type<typeof EdgeSchema>;

export const NodeLabelSchema = Schema.Struct({
	id: Schema.String,
	label: Schema.String,
});
export type NodeLabel = Schema.Schema.Type<typeof NodeLabelSchema>;

export const PropositionSchema = Schema.Struct({
	source: NodeLabelSchema,
	link: NodeLabelSchema,
	target: NodeLabelSchema,
});
export type Proposition = Schema.Schema.Type<typeof PropositionSchema>;

export interface DiagnosisResult {
	correct: Array<{ source: string; target: string; edgeId?: string }>;
	missing: Array<{ source: string; target: string; edgeId?: string }>;
	excessive: Array<{ source: string; target: string; edgeId?: string }>;
	score: number;
	totalGoalEdges: number;
}

export function compareMaps(
	goalMapEdges: Readonly<Edge[]>,
	learnerEdges: Readonly<Edge[]>,
): Effect.Effect<DiagnosisResult, never> {
	return Effect.gen(function* () {
		// Create sets for comparison
		const goalMapSet = new Set(
			goalMapEdges.map((e) => `${e.source}-${e.target}`),
		);
		const learnerMapSet = new Set(
			learnerEdges.map((e) => `${e.source}-${e.target}`),
		);

		// Find correct edges (in both maps)
		const correct = goalMapEdges.filter((edge) =>
			learnerMapSet.has(`${edge.source}-${edge.target}`),
		);

		// Find missing edges (in goal map but not in learner map)
		const missing = goalMapEdges.filter(
			(edge) => !learnerMapSet.has(`${edge.source}-${edge.target}`),
		);

		// Find excessive edges (in learner map but not in goal map)
		const excessive = learnerEdges.filter(
			(edge) => !goalMapSet.has(`${edge.source}-${edge.target}`),
		);

		// Calculate score
		const score =
			goalMapEdges.length > 0
				? Math.round((correct.length / goalMapEdges.length) * 100) / 100
				: 1;

		return {
			correct: correct.map((e) => ({
				source: e.source,
				target: e.target,
				edgeId: e.id,
			})),
			missing: missing.map((e) => ({
				source: e.source,
				target: e.target,
				edgeId: e.id,
			})),
			excessive: excessive.map((e) => ({
				source: e.source,
				target: e.target,
				edgeId: e.id,
			})),
			score,
			totalGoalEdges: goalMapEdges.length,
		};
	});
}

export interface EdgeClassification {
	edge: Edge;
	type: "correct" | "missing" | "excessive" | "neutral";
}

export const EdgeClassificationSchema = Schema.Struct({
	edge: EdgeSchema,
	type: Schema.Literal("correct", "missing", "excessive", "neutral"),
});

export function classifyEdges(
	goalMapEdges: Readonly<Edge[]>,
	learnerEdges: Readonly<Edge[]>,
): Effect.Effect<EdgeClassification[], never> {
	return Effect.gen(function* () {
		const diagnosis = yield* compareMaps(goalMapEdges, learnerEdges);

		// Create lookup maps for edge classification
		const correctMap = new Set(
			diagnosis.correct.map((e) => `${e.source}-${e.target}`),
		);
		const excessiveMap = new Set(
			diagnosis.excessive.map((e) => `${e.source}-${e.target}`),
		);

		// Classify learner edges
		const learnerClassifications: EdgeClassification[] = learnerEdges.map(
			(edge) => ({
				edge,
				type: excessiveMap.has(`${edge.source}-${edge.target}`)
					? "excessive"
					: correctMap.has(`${edge.source}-${edge.target}`)
						? "correct"
						: "neutral",
			}),
		);

		// Add missing edges as dashed (they don't exist in learner map)
		const missingClassifications: EdgeClassification[] = diagnosis.missing.map(
			(missing) => ({
				edge: {
					id: `missing-${missing.source}-${missing.target}`,
					source: missing.source,
					target: missing.target,
					animated: true,
					style: { strokeDasharray: "5,5", opacity: 0.5 },
				},
				type: "missing" as const,
			}),
		);

		return [...learnerClassifications, ...missingClassifications];
	});
}

export function getEdgeStyleByType(
	type: "correct" | "missing" | "excessive" | "neutral",
	useAnalyticsColors = false,
) {
	return Match.value(type).pipe(
		Match.when("correct", () => ({
			stroke: "#22c55e",
			strokeWidth: 3,
		})),
		Match.when("excessive", () => ({
			stroke: useAnalyticsColors ? "#3b82f6" : "#ef4444",
			strokeWidth: 3,
		})),
		Match.when("missing", () => ({
			stroke: useAnalyticsColors ? "#ef4444" : "#f59e0b",
			strokeWidth: 2,
			strokeDasharray: "5,5",
			opacity: useAnalyticsColors ? 0.8 : 0.7,
		})),
		Match.when("neutral", () => ({
			stroke: useAnalyticsColors ? "#64748b" : "#6b7280",
			strokeWidth: 2,
		})),
		Match.exhaustive,
	);
}
