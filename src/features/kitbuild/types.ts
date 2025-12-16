import type { Node } from "@xyflow/react";

export type TextNodeData = {
	label: string;
	/** Legacy variant support */
	variant?: "green" | "blue" | "default";
	/** Tailwind color value, e.g. "amber-500" */
	color?: string;
};

export type ImageNodeData = {
	url: string;
	caption?: string;
	width?: number;
	height?: number;
};

export type ConnectorNodeData = {
	label: string;
};

export type AnyNode = Node<TextNodeData | ImageNodeData | ConnectorNodeData>;
