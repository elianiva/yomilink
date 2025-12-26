import { describe, expect, it } from "vitest";
import { getEdgeStyleByType, ANALYTICS_COLORS } from "./edge-styles";

describe("getEdgeStyleByType", () => {
	it("should return correct style for match edge", () => {
		const style = getEdgeStyleByType("match");
		expect(style).toEqual({
			strokeWidth: 3,
			strokeOpacity: 1,
			stroke: ANALYTICS_COLORS.match,
		});
	});

	it("should return correct style for miss edge", () => {
		const style = getEdgeStyleByType("miss");
		expect(style).toEqual({
			strokeWidth: 3,
			strokeOpacity: 1,
			stroke: ANALYTICS_COLORS.miss,
			strokeDasharray: "5,5",
		});
	});

	it("should return correct style for excess edge", () => {
		const style = getEdgeStyleByType("excess");
		expect(style).toEqual({
			strokeWidth: 3,
			strokeOpacity: 1,
			stroke: ANALYTICS_COLORS.excess,
		});
	});

	it("should return correct style for leave edge", () => {
		const style = getEdgeStyleByType("leave");
		expect(style).toEqual({
			strokeWidth: 3,
			strokeOpacity: 0.5,
			stroke: ANALYTICS_COLORS.leave,
			strokeDasharray: "2,2",
		});
	});

	it("should return correct style for abandon edge", () => {
		const style = getEdgeStyleByType("abandon");
		expect(style).toEqual({
			strokeWidth: 3,
			strokeOpacity: 0.4,
			stroke: ANALYTICS_COLORS.abandon,
			strokeDasharray: "4,4",
		});
	});

	it("should return correct style for neutral edge", () => {
		const style = getEdgeStyleByType("neutral");
		expect(style).toEqual({
			strokeWidth: 3,
			strokeOpacity: 1,
			stroke: ANALYTICS_COLORS.neutral,
		});
	});

	it("should accept optional count parameter", () => {
		const style = getEdgeStyleByType("match", 5);
		expect(style).toHaveProperty("strokeWidth", 3);
	});
});

describe("ANALYTICS_COLORS", () => {
	it("should have all required color properties", () => {
		expect(ANALYTICS_COLORS).toHaveProperty("match");
		expect(ANALYTICS_COLORS).toHaveProperty("miss");
		expect(ANALYTICS_COLORS).toHaveProperty("excess");
		expect(ANALYTICS_COLORS).toHaveProperty("leave");
		expect(ANALYTICS_COLORS).toHaveProperty("abandon");
		expect(ANALYTICS_COLORS).toHaveProperty("neutral");
	});

	it("should have valid hex color values", () => {
		const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

		expect(ANALYTICS_COLORS.match).toMatch(hexColorRegex);
		expect(ANALYTICS_COLORS.miss).toMatch(hexColorRegex);
		expect(ANALYTICS_COLORS.excess).toMatch(hexColorRegex);
		expect(ANALYTICS_COLORS.leave).toMatch(hexColorRegex);
		expect(ANALYTICS_COLORS.abandon).toMatch(hexColorRegex);
		expect(ANALYTICS_COLORS.neutral).toMatch(hexColorRegex);
	});
});
