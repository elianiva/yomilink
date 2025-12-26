import type { Edge } from "@xyflow/react";

export interface PropositionWithCount {
	source: { id: string; label: string };
	link: { id: string; label: string };
	target: { id: string; label: string };
	count: number;
	learnerIds: string[];
	learnerNames: string[];
	type: "match" | "miss" | "excessive" | "leave" | "abandon";
}

export interface GroupComparison {
	match: PropositionWithCount[];
	miss: PropositionWithCount[];
	excessive: PropositionWithCount[];
	leave: PropositionWithCount[];
	abandon: PropositionWithCount[];
}

export interface LearnerMapComparisonData {
	id: string;
	userId: string;
	userName: string;
	edges: Edge[];
	comparison: {
		match: Edge[];
		miss: Edge[];
		excessive: Edge[];
	};
}

export function groupCompare(
	learnerMaps: LearnerMapComparisonData[],
	goalMapEdges: Edge[],
): GroupComparison {
	const matchMap = new Map<string, PropositionWithCount>();
	const missMap = new Map<string, PropositionWithCount>();
	const excessiveMap = new Map<string, PropositionWithCount>();
	const leaveMap = new Map<string, PropositionWithCount>();
	const abandonMap = new Map<string, PropositionWithCount>();

	for (const learner of learnerMaps) {
		for (const edge of learner.comparison.match) {
			const key = `${edge.source}-${edge.target}`;
			if (!matchMap.has(key)) {
				matchMap.set(key, {
					source: edge.source,
					link: edge.source,
					target: edge.target,
					count: 1,
					learnerIds: [learner.userId],
					learnerNames: [learner.userName],
					type: "match" as const,
				});
			} else {
				const existing = matchMap.get(key)!;
				existing.count += 1;
				existing.learnerIds.push(learner.userId);
				existing.learnerNames.push(learner.userName);
			}
		}

		for (const edge of learner.comparison.miss) {
			const key = `${edge.source}-${edge.target}`;
			if (!missMap.has(key)) {
				missMap.set(key, {
					source: edge.source,
					link: edge.source,
					target: edge.target,
					count: 1,
					learnerIds: [learner.userId],
					learnerNames: [learner.userName],
					type: "miss" as const,
				});
			} else {
				const existing = missMap.get(key)!;
				existing.count += 1;
				existing.learnerIds.push(learner.userId);
				existing.learnerNames.push(learner.userName);
			}
		}

		for (const edge of learner.comparison.excessive) {
			const key = `${edge.source}-${edge.target}`;
			if (!excessiveMap.has(key)) {
				excessiveMap.set(key, {
					source: edge.source,
					link: edge.source,
					target: edge.target,
					count: 1,
					learnerIds: [learner.userId],
					learnerNames: [learner.userName],
					type: "excessive" as const,
				});
			} else {
				const existing = excessiveMap.get(key)!;
				existing.count += 1;
				existing.learnerIds.push(learner.userId);
				existing.learnerNames.push(learner.userName);
			}
		}
	}

	// Calculate leave and abandon based on group data
	const goalMapSet = new Set(
		goalMapEdges.map((e) => `${e.source}-${e.target}`),
	);

	for (const edge of goalMapEdges) {
		const key = `${edge.source}-${edge.target}`;

		if (!goalMapSet.has(key)) {
			continue;
		}

		let usedBy = 0;
		for (const prop of matchMap.values()) {
			if (prop.source.id === edge.source && prop.target.id === edge.target) {
				usedBy += 1;
			}
		}

		if (usedBy === 0) {
			leaveMap.set(key, {
				source: edge.source,
				link: edge.source,
				target: edge.target,
				count: 0,
				learnerIds: [],
				learnerNames: [],
				type: "leave" as const,
			});
		} else {
			abandonMap.set(key, {
				source: edge.source,
				link: edge.source,
				target: edge.target,
				count: 0,
				learnerIds: [],
				learnerNames: [],
				type: "abandon" as const,
			});
		}
	}

	return {
		match: Array.from(matchMap.values()),
		miss: Array.from(missMap.values()),
		excessive: Array.from(excessiveMap.values()),
		leave: Array.from(leaveMap.values()),
		abandon: Array.from(abandonMap.values()),
	};
}
