import type { Edge, Node } from "@xyflow/react";
import { Effect, Schema } from "effect";

// Types for validation
export interface ConceptNode extends Node {
	type: "text" | "image";
	data: { label: string } | { caption: string; url: string };
}

export interface ConnectorNode extends Node {
	type: "connector";
	data: { label: string };
}

export interface Proposition {
	source: ConceptNode;
	link: ConnectorNode;
	target: ConceptNode;
}

// Validation schemas
export const ValidationResultSchema = Schema.Struct({
	isValid: Schema.Boolean,
	errors: Schema.Array(Schema.NonEmptyString),
	warnings: Schema.Array(Schema.NonEmptyString),
	propositions: Schema.Array(
		Schema.Struct({
			sourceId: Schema.NonEmptyString,
			linkId: Schema.NonEmptyString,
			targetId: Schema.NonEmptyString,
		}),
	),
});

export type ValidationResult = typeof ValidationResultSchema.Type;

// Validation service
export class GoalMapValidator extends Effect.Service<GoalMapValidator>()(
	"GoalMapValidator",
	{
		effect: Effect.succeed({
			validateNodes: (nodes: Node[], edges: Edge[]) =>
				Effect.gen(function* () {
					const errors: string[] = [];
					const warnings: string[] = [];
					const propositions: Proposition[] = [];

					// Separate node types
					const conceptNodes = nodes.filter(
						(n): n is ConceptNode => n.type === "text" || n.type === "image",
					);
					const connectorNodes = nodes.filter(
						(n): n is ConnectorNode => n.type === "connector",
					);

					// Basic structure validation
					if (conceptNodes.length < 2) {
						errors.push("At least 2 concept nodes (text/image) required");
					}
					if (connectorNodes.length < 1) {
						errors.push("At least 1 connector node required");
					}
					if (edges.length < 2) {
						errors.push("At least 2 edges required");
					}

					// Node ID uniqueness
					const nodeIds = new Set(nodes.map((n) => n.id));
					if (nodeIds.size !== nodes.length) {
						errors.push("All node IDs must be unique");
					}

					// Edge validation - edges must connect existing nodes
					const edgeErrors = edges.flatMap((e) => {
						const errs: string[] = [];
						if (!nodeIds.has(e.source)) {
							errs.push(
								`Edge ${e.id ?? `${e.source}-${e.target}`} source node ${e.source} does not exist`,
							);
						}
						if (!nodeIds.has(e.target)) {
							errs.push(
								`Edge ${e.id ?? `${e.source}-${e.target}`} target node ${e.target} does not exist`,
							);
						}
						return errs;
					});
					errors.push(...edgeErrors);

					// KBFIRA-specific validation: Connector connection rules
					const inCount: Record<string, number> = {};
					const outCount: Record<string, number> = {};
					const connections: Record<
						string,
						{ sources: string[]; targets: string[] }
					> = {};

					edges.forEach((e) => {
						outCount[e.source] = (outCount[e.source] ?? 0) + 1;
						inCount[e.target] = (inCount[e.target] ?? 0) + 1;

						// Track connections for each node
						if (!connections[e.source])
							connections[e.source] = { sources: [], targets: [] };
						if (!connections[e.target])
							connections[e.target] = { sources: [], targets: [] };
						connections[e.source].targets.push(e.target);
						connections[e.target].sources.push(e.source);
					});

					// Validate connector nodes (must have at least 1 inbound and 1 outbound)
					connectorNodes.forEach((connector) => {
						const inbound = inCount[connector.id] ?? 0;
						const outbound = outCount[connector.id] ?? 0;

						if (inbound === 0) {
							errors.push(
								`Connector "${(connector.data as any).label}" has no inbound connections`,
							);
						}
						if (outbound === 0) {
							errors.push(
								`Connector "${(connector.data as any).label}" has no outbound connections`,
							);
						}

						// KBFIRA rule: Connectors should typically connect concepts, not other connectors
						const conn = connections[connector.id];
						const sourceTypes = conn.sources.map(
							(s) => nodes.find((n) => n.id === s)?.type,
						);
						const targetTypes = conn.targets.map(
							(t) => nodes.find((n) => n.id === t)?.type,
						);

						const invalidSources = sourceTypes.filter((t) => t === "connector");
						const invalidTargets = targetTypes.filter((t) => t === "connector");

						if (invalidSources.length > 0) {
							warnings.push(
								`Connector "${(connector.data as any).label}" has connector(s) as source(s) - this may create complex relationships`,
							);
						}
						if (invalidTargets.length > 0) {
							warnings.push(
								`Connector "${(connector.data as any).label}" has connector(s) as target(s) - this may create complex relationships`,
							);
						}
					});

					// Validate concept nodes (should have connections)
					conceptNodes.forEach((concept) => {
						const totalConnections =
							(inCount[concept.id] ?? 0) + (outCount[concept.id] ?? 0);
						if (totalConnections === 0) {
							warnings.push(
								`Concept node "${(concept.data as any).label || (concept.data as any).caption}" is not connected to any other nodes`,
							);
						}
					});

					// KBFIRA proposition composition validation
					const validator = yield* GoalMapValidator;
					const composedPropositions = yield* validator.composePropositions(
						nodes,
						edges,
					);
					propositions.push(...composedPropositions);

					// Validate proposition structure
					if (
						composedPropositions.length === 0 &&
						conceptNodes.length >= 2 &&
						connectorNodes.length >= 1
					) {
						errors.push(
							"No valid propositions found - check that connectors properly connect concept nodes",
						);
					}

					// Check for isolated subgraphs
					const connectedComponents = findConnectedComponents(nodes, edges);
					if (connectedComponents.length > 1) {
						warnings.push(
							`Goal map has ${connectedComponents.length} disconnected sections - consider connecting them for better learning outcomes`,
						);
					}

					// Check for potential cycles (which may indicate circular reasoning)
					const hasCycles = detectCycles(nodes, edges);
					if (hasCycles) {
						warnings.push(
							"Circular relationships detected - this may indicate circular reasoning in the concept structure",
						);
					}

					return {
						isValid: errors.length === 0,
						errors,
						warnings,
						propositions: composedPropositions.map((p: Proposition) => ({
							sourceId: p.source.id,
							linkId: p.link.id,
							targetId: p.target.id,
						})),
					};
				}),

			composePropositions: (nodes: Node[], edges: Edge[]) =>
				Effect.gen(function* () {
					const concepts = new Map(
						nodes
							.filter(
								(n): n is ConceptNode =>
									n.type === "text" || n.type === "image",
							)
							.map((c) => [c.id, c]),
					);
					const connectors = new Map(
						nodes
							.filter((n): n is ConnectorNode => n.type === "connector")
							.map((c) => [c.id, c]),
					);

					const propositions: Proposition[] = [];

					// Find propositions: concept -> connector -> concept
					connectors.forEach((connector) => {
						const inboundEdges = edges.filter((e) => e.target === connector.id);
						const outboundEdges = edges.filter(
							(e) => e.source === connector.id,
						);

						inboundEdges.forEach((inEdge) => {
							const sourceConcept = concepts.get(inEdge.source);
							if (!sourceConcept) return;

							outboundEdges.forEach((outEdge) => {
								const targetConcept = concepts.get(outEdge.target);
								if (!targetConcept) return;

								propositions.push({
									source: sourceConcept,
									link: connector,
									target: targetConcept,
								});
							});
						});
					});

					return propositions;
				}),
		}),
	},
) {}

// Helper functions
function findConnectedComponents(nodes: Node[], edges: Edge[]): Node[][] {
	const visited = new Set<string>();
	const components: Node[][] = [];

	function dfs(nodeId: string, component: Node[]) {
		if (visited.has(nodeId)) return;
		visited.add(nodeId);

		const node = nodes.find((n) => n.id === nodeId);
		if (node) component.push(node);

		// Visit all connected nodes
		edges.forEach((edge) => {
			if (edge.source === nodeId && !visited.has(edge.target)) {
				dfs(edge.target, component);
			} else if (edge.target === nodeId && !visited.has(edge.source)) {
				dfs(edge.source, component);
			}
		});
	}

	nodes.forEach((node) => {
		if (!visited.has(node.id)) {
			const component: Node[] = [];
			dfs(node.id, component);
			components.push(component);
		}
	});

	return components;
}

function detectCycles(nodes: Node[], edges: Edge[]): boolean {
	const visited = new Set<string>();
	const recursionStack = new Set<string>();

	function hasCycle(nodeId: string): boolean {
		if (recursionStack.has(nodeId)) return true;
		if (visited.has(nodeId)) return false;

		visited.add(nodeId);
		recursionStack.add(nodeId);

		// Check all neighbors
		for (const edge of edges) {
			if (edge.source === nodeId) {
				if (hasCycle(edge.target)) return true;
			}
		}

		recursionStack.delete(nodeId);
		return false;
	}

	return nodes.some((node) => hasCycle(node.id));
}
