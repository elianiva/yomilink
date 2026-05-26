import { createActor } from "xstate";
import { describe, expect, it } from "vite-plus/test";

import { signUpMachine } from "./signup.machine";

describe("signUpMachine", () => {
	it("should start at step 0 with no errors", () => {
		const actor = createActor(signUpMachine).start();
		const snapshot = actor.getSnapshot();
		expect(snapshot.value).toBe("active");
		expect(snapshot.context.step).toBe(0);
		expect(snapshot.context.completed).toEqual([]);
		expect(snapshot.context.error).toBeNull();
	});

	it("should advance to next step on NEXT", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().context.step).toBe(1);
	});

	it("should go back to previous step on PREVIOUS", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().context.step).toBe(2);
		actor.send({ type: "PREVIOUS" });
		expect(actor.getSnapshot().context.step).toBe(1);
	});

	it("should not go below step 0", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "PREVIOUS" });
		expect(actor.getSnapshot().context.step).toBe(0);
	});

	it("should not go above step 3", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().context.step).toBe(3);
	});

	it("should track completed steps", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().context.completed).toContain(0);
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().context.completed).toContain(1);
	});

	it("should set error on SET_ERROR", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "SET_ERROR", message: "Something went wrong" });
		expect(actor.getSnapshot().context.error).toBe("Something went wrong");
	});

	it("should clear error on CLEAR_ERROR", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "SET_ERROR", message: "Something went wrong" });
		actor.send({ type: "CLEAR_ERROR" });
		expect(actor.getSnapshot().context.error).toBeNull();
	});

	it("should clear error when navigating", () => {
		const actor = createActor(signUpMachine).start();
		actor.send({ type: "SET_ERROR", message: "Error" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().context.error).toBeNull();
	});
});
