import type { Node } from "@xyflow/react";

const GRID_GAP_X = 200;
const GRID_GAP_Y = 120;
const START_X = 50;
const START_Y = 50;

/**
 * Arrange nodes in a grid pattern.
 * This is used when starting a new learner map to scramble the kit nodes.
 */
export function arrangeNodesInGrid(
	nodes: Node[],
	options?: {
		columns?: number;
		gapX?: number;
		gapY?: number;
		startX?: number;
		startY?: number;
	},
): Node[] {
	const {
		columns = Math.ceil(Math.sqrt(nodes.length)),
		gapX = GRID_GAP_X,
		gapY = GRID_GAP_Y,
		startX = START_X,
		startY = START_Y,
	} = options ?? {};

	return nodes.map((node, index) => {
		const col = index % columns;
		const row = Math.floor(index / columns);

		return {
			...node,
			position: {
				x: startX + col * gapX,
				y: startY + row * gapY,
			},
		};
	});
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Arrange nodes in a grid with shuffled order.
 * This creates a randomized starting layout for students.
 */
export function arrangeNodesInShuffledGrid(
	nodes: Node[],
	options?: {
		columns?: number;
		gapX?: number;
		gapY?: number;
		startX?: number;
		startY?: number;
	},
): Node[] {
	const shuffledNodes = shuffleArray(nodes);
	return arrangeNodesInGrid(shuffledNodes, options);
}

/**
 * Separate nodes by type and arrange concepts and connectors in different regions
 */
export function arrangeNodesByType(
	nodes: Node[],
	options?: {
		conceptColumns?: number;
		connectorColumns?: number;
		gapX?: number;
		gapY?: number;
	},
): Node[] {
	const {
		conceptColumns = 4,
		connectorColumns = 3,
		gapX = GRID_GAP_X,
		gapY = GRID_GAP_Y,
	} = options ?? {};

	// Separate nodes by type
	const concepts = shuffleArray(nodes.filter((n) => n.type === "text" || n.type === "image"));
	const connectors = shuffleArray(nodes.filter((n) => n.type === "connector"));

	// Arrange concepts in upper section
	const arrangedConcepts = concepts.map((node, index) => {
		const col = index % conceptColumns;
		const row = Math.floor(index / conceptColumns);
		return {
			...node,
			position: {
				x: START_X + col * gapX,
				y: START_Y + row * gapY,
			},
		};
	});

	// Calculate where connectors should start (below concepts)
	const conceptRows = Math.ceil(concepts.length / conceptColumns);
	const connectorStartY = START_Y + conceptRows * gapY + 80;

	// Arrange connectors in lower section
	const arrangedConnectors = connectors.map((node, index) => {
		const col = index % connectorColumns;
		const row = Math.floor(index / connectorColumns);
		return {
			...node,
			position: {
				x: START_X + col * gapX + 50, // Slightly offset
				y: connectorStartY + row * (gapY * 0.8),
			},
		};
	});

	return [...arrangedConcepts, ...arrangedConnectors];
}
