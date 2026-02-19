import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { calculateDelayedUnlock } from "./unlock-service";

describe("calculateDelayedUnlock", () => {
	it("calculates unlock time with delay", async () => {
		const completedAt = new Date("2024-01-01T00:00:00Z");
		const result = await Effect.runPromise(
			calculateDelayedUnlock({
				completedAt: completedAt.toISOString(),
				delayDays: 7,
			}),
		);

		const expectedUnlock = new Date(completedAt);
		expectedUnlock.setDate(expectedUnlock.getDate() + 7);

		expect(result.delayDays).toBe(7);
		expect(new Date(result.unlockAt).getDate()).toBe(expectedUnlock.getDate());
		expect(result.formattedUnlockDate).toBe(
			expectedUnlock.toLocaleDateString(),
		);
	});

	it("returns isUnlocked true when delay has passed", async () => {
		// Use a date 10 days ago so 7-day delay has passed
		const completedAt = new Date();
		completedAt.setDate(completedAt.getDate() - 10);

		const result = await Effect.runPromise(
			calculateDelayedUnlock({
				completedAt: completedAt.toISOString(),
				delayDays: 7,
			}),
		);

		expect(result.isUnlocked).toBe(true);
	});

	it("returns isUnlocked false when delay has not passed", async () => {
		// Use today's date so 7-day delay has not passed
		const completedAt = new Date();

		const result = await Effect.runPromise(
			calculateDelayedUnlock({
				completedAt: completedAt.toISOString(),
				delayDays: 7,
			}),
		);

		expect(result.isUnlocked).toBe(false);
	});

	it("handles zero delay correctly", async () => {
		const completedAt = new Date();
		const result = await Effect.runPromise(
			calculateDelayedUnlock({
				completedAt: completedAt.toISOString(),
				delayDays: 0,
			}),
		);

		// With 0 delay and completed in the past, should be unlocked
		expect(result.isUnlocked).toBe(true);
	});
});
