import type { Edge, Node } from "@/lib/learnermap-comparator";

export const simpleGoalMap = {
	nodes: [
		{
			id: "c1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Concept A" },
		} as Node,
		{
			id: "c2",
			type: "text",
			position: { x: 200, y: 0 },
			data: { label: "Concept B" },
		} as Node,
		{
			id: "l1",
			type: "connector",
			position: { x: 100, y: 100 },
			data: { label: "is" },
		} as Node,
	],
	edges: [
		{ id: "e1", source: "c1", target: "l1" } as Edge,
		{ id: "e2", source: "l1", target: "c2" } as Edge,
	],
} as const;

export const invalidGoalMap = {
	nodes: [
		{
			id: "c1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Concept A" },
		} as Node,
	],
	edges: [],
} as const;

export const cyclicGoalMap = {
	nodes: [
		{
			id: "c1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Concept A" },
		} as Node,
		{
			id: "c2",
			type: "text",
			position: { x: 200, y: 0 },
			data: { label: "Concept B" },
		} as Node,
		{
			id: "c3",
			type: "text",
			position: { x: 100, y: 100 },
			data: { label: "Concept C" },
		} as Node,
	],
	edges: [
		{ id: "e1", source: "c1", target: "c2" } as Edge,
		{ id: "e2", source: "c2", target: "c3" } as Edge,
		{ id: "e3", source: "c3", target: "c1" } as Edge,
	],
} as const;

export const complexGoalMap = {
	nodes: [
		{
			id: "c1",
			type: "text",
			position: { x: 0, y: 0 },
			data: { label: "Dog" },
		} as Node,
		{
			id: "c2",
			type: "text",
			position: { x: 200, y: 0 },
			data: { label: "Animal" },
		} as Node,
		{
			id: "c3",
			type: "text",
			position: { x: 400, y: 0 },
			data: { label: "Mammal" },
		} as Node,
		{
			id: "c4",
			type: "text",
			position: { x: 200, y: 150 },
			data: { label: "Cat" },
		} as Node,
		{
			id: "l1",
			type: "connector",
			position: { x: 100, y: 100 },
			data: { label: "is a" },
		} as Node,
		{
			id: "l2",
			type: "connector",
			position: { x: 300, y: 100 },
			data: { label: "is a" },
		} as Node,
		{
			id: "l3",
			type: "connector",
			position: { x: 300, y: 250 },
			data: { label: "is not" },
		} as Node,
	],
	edges: [
		{ id: "e1", source: "c1", target: "l1" } as Edge,
		{ id: "e2", source: "l1", target: "c2" } as Edge,
		{ id: "e3", source: "c2", target: "l2" } as Edge,
		{ id: "e4", source: "l2", target: "c3" } as Edge,
		{ id: "e5", source: "c4", target: "l3" } as Edge,
		{ id: "e6", source: "l3", target: "c2" } as Edge,
	],
} as const;
