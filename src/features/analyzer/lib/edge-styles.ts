export const ANALYTICS_COLORS = {
	match: "#16a34a",
	miss: "#ef4444",
	excess: "#3b82f6",
	leave: "#64748b",
	abandon: "#a16207",
	neutral: "#94a3b8",
} as const;

export function getEdgeStyleByType(
	type: "match" | "miss" | "excess" | "leave" | "abandon" | "neutral",
	count?: number,
) {
	const baseStyle = {
		strokeWidth: 3,
		strokeOpacity: 1,
	};

	switch (type) {
		case "match":
			return {
				...baseStyle,
				stroke: ANALYTICS_COLORS.match,
			};
		case "miss":
			return {
				...baseStyle,
				stroke: ANALYTICS_COLORS.miss,
				strokeDasharray: "5,5",
			};
		case "excess":
			return {
				...baseStyle,
				stroke: ANALYTICS_COLORS.excess,
			};
		case "leave":
			return {
				...baseStyle,
				stroke: ANALYTICS_COLORS.leave,
				strokeDasharray: "2,2",
				strokeOpacity: 0.5,
			};
		case "abandon":
			return {
				...baseStyle,
				stroke: ANALYTICS_COLORS.abandon,
				strokeDasharray: "4,4",
				strokeOpacity: 0.4,
			};
		default:
			return {
				...baseStyle,
				stroke: ANALYTICS_COLORS.neutral,
			};
	}
}
