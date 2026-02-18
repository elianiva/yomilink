import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { checkTimeBasedCondition } from "./unlock-service";

describe("checkTimeBasedCondition", () => {
	it("should return unlocked when time has passed", async () => {
		const pastDate = new Date(Date.now() - 1000 * 60).toISOString();
		const condition = { type: "time" as const, unlockAt: pastDate };

		const result = await Effect.runPromise(checkTimeBasedCondition(condition));

		expect(result.isUnlocked).toBe(true);
		expect(result.reason).toBeNull();
	});

	it("should return locked when time is in future", async () => {
		const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
		const condition = { type: "time" as const, unlockAt: futureDate };

		const result = await Effect.runPromise(checkTimeBasedCondition(condition));

		expect(result.isUnlocked).toBe(false);
		expect(result.reason).toContain("Unlocks at");
	});

	it("should return invalid for non-time condition", async () => {
		const condition = { type: "manual" as const };

		const result = await Effect.runPromise(checkTimeBasedCondition(condition));

		expect(result.isUnlocked).toBe(false);
		expect(result.reason).toBe("Invalid condition type");
	});
});
