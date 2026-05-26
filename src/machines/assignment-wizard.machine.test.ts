import { createActor } from "xstate";
import { describe, expect, it } from "vite-plus/test";

import { assignmentWizardMachine } from "./assignment-wizard.machine";

describe("assignmentWizardMachine", () => {
	it("should start at basicInfo with step 0", () => {
		const actor = createActor(assignmentWizardMachine).start();
		const s = actor.getSnapshot();
		expect(s.value).toBe("basicInfo");
		expect(s.context.currentStep).toBe(0);
		expect(s.context.basic.title).toBe("");
	});

	it("should not proceed from basicInfo without a title", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("basicInfo");
	});

	it("should proceed to config when title is set", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("config");
		expect(actor.getSnapshot().context.currentStep).toBe(1);
	});

	it("should not proceed from config without goalMapId", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("config");
	});

	it("should proceed to procedure when goalMapId is set", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("procedure");
		expect(actor.getSnapshot().context.currentStep).toBe(2);
	});

	it("should not proceed from procedure without preTestFormId", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("procedure");
	});

	it("should proceed to assignment when preTestFormId is set", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("assignment");
		expect(actor.getSnapshot().context.currentStep).toBe(3);
	});

	it("should not proceed from assignment without any target", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("assignment");
	});

	it("should allow proceeding when cohort is selected", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "TOGGLE_COHORT", cohortId: "cohort-1" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("submitting");
	});

	it("should allow proceeding when user is selected", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "TOGGLE_USER", userId: "user-1" });
		actor.send({ type: "NEXT" });
		expect(actor.getSnapshot().value).toBe("submitting");
	});

	it("should allow going back one step", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });

		expect(actor.getSnapshot().value).toBe("config");
		actor.send({ type: "BACK" });
		expect(actor.getSnapshot().value).toBe("basicInfo");
	});

	it("should toggle cohorts on/off", () => {
		const actor = createActor(assignmentWizardMachine).start();
		// Navigate to assignment step
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });

		actor.send({ type: "TOGGLE_COHORT", cohortId: "c1" });
		expect(actor.getSnapshot().context.assignment.selectedCohorts).toEqual(["c1"]);

		actor.send({ type: "TOGGLE_COHORT", cohortId: "c1" });
		expect(actor.getSnapshot().context.assignment.selectedCohorts).toEqual([]);
	});

	it("should toggle users on/off", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });

		actor.send({ type: "TOGGLE_USER", userId: "u1" });
		actor.send({ type: "TOGGLE_USER", userId: "u2" });
		expect(actor.getSnapshot().context.assignment.selectedUsers).toEqual(["u1", "u2"]);

		actor.send({ type: "TOGGLE_USER", userId: "u1" });
		expect(actor.getSnapshot().context.assignment.selectedUsers).toEqual(["u2"]);
	});

	it("should set basic fields", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "SET_BASIC", field: "description", value: "A description" });
		expect(actor.getSnapshot().context.basic).toEqual({
			title: "My Assignment",
			description: "A description",
		});
	});

	it("should set config fields", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "x" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		expect(actor.getSnapshot().context.config.goalMapId).toBe("gm-1");
	});

	it("should set procedure fields", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "x" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "postTestFormId", value: "form-2" });
		actor.send({ type: "SET_PROCEDURE", field: "delayedPostTestDelayDays", value: 14 });
		expect(actor.getSnapshot().context.procedure.postTestFormId).toBe("form-2");
		expect(actor.getSnapshot().context.procedure.delayedPostTestDelayDays).toBe(14);
	});

	it("should transition to done on SUCCESS after submitting", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_CONFIG", field: "goalMapId", value: "gm-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SET_PROCEDURE", field: "preTestFormId", value: "form-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "TOGGLE_COHORT", cohortId: "cohort-1" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "SUCCESS" });
		expect(actor.getSnapshot().value).toBe("done");
	});

	it("should reset to initial state on RESET", () => {
		const actor = createActor(assignmentWizardMachine).start();
		actor.send({ type: "SET_BASIC", field: "title", value: "My Assignment" });
		actor.send({ type: "NEXT" });
		actor.send({ type: "RESET" });
		const s = actor.getSnapshot();
		expect(s.value).toBe("basicInfo");
		expect(s.context.currentStep).toBe(0);
		expect(s.context.basic.title).toBe("");
	});
});
