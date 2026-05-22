import { setup, assign } from "xstate";

export type WizardFields = {
	basic: { title: string; description: string };
	config: { goalMapId: string; startDate: string; endDate: string };
	procedure: {
		preTestFormId: string;
		postTestFormId: string;
		delayedPostTestFormId: string;
		delayedPostTestDelayDays: number;
		tamFormId: string;
	};
	assignment: { selectedCohorts: string[]; selectedUsers: string[] };
};

export type WizardEvent =
	| { type: "NEXT" }
	| { type: "BACK" }
	| { type: "SET_BASIC"; field: keyof WizardFields["basic"]; value: string }
	| { type: "SET_CONFIG"; field: keyof WizardFields["config"]; value: string }
	| {
			type: "SET_PROCEDURE";
			field: keyof WizardFields["procedure"];
			value: string | number;
	  }
	| { type: "TOGGLE_COHORT"; cohortId: string }
	| { type: "TOGGLE_USER"; userId: string }
	| { type: "SUBMIT" }
	| { type: "SUCCESS" }
	| { type: "RESET" };

const initialFields: WizardFields = {
	basic: { title: "", description: "" },
	config: { goalMapId: "", startDate: "", endDate: "" },
	procedure: {
		preTestFormId: "",
		postTestFormId: "",
		delayedPostTestFormId: "",
		delayedPostTestDelayDays: 7,
		tamFormId: "",
	},
	assignment: { selectedCohorts: [], selectedUsers: [] },
};

export const assignmentWizardMachine = setup({
	types: {
		context: {} as WizardFields & { currentStep: number; error: string | null },
		events: {} as WizardEvent,
	},
	actions: {
		assignBasic: assign(({ context, event }) => {
			if (event.type !== "SET_BASIC") return {};
			return {
				basic: { ...context.basic, [event.field]: event.value },
			};
		}),
		assignConfig: assign(({ context, event }) => {
			if (event.type !== "SET_CONFIG") return {};
			return {
				config: { ...context.config, [event.field]: event.value },
			};
		}),
		assignProcedure: assign(({ context, event }) => {
			if (event.type !== "SET_PROCEDURE") return {};
			return {
				procedure: { ...context.procedure, [event.field]: event.value },
			};
		}),
		toggleCohort: assign(({ context, event }) => {
			if (event.type !== "TOGGLE_COHORT") return {};
			const cohorts = context.assignment.selectedCohorts.includes(event.cohortId)
				? context.assignment.selectedCohorts.filter((id) => id !== event.cohortId)
				: [...context.assignment.selectedCohorts, event.cohortId];
			return { assignment: { ...context.assignment, selectedCohorts: cohorts } };
		}),
		toggleUser: assign(({ context, event }) => {
			if (event.type !== "TOGGLE_USER") return {};
			const users = context.assignment.selectedUsers.includes(event.userId)
				? context.assignment.selectedUsers.filter((id) => id !== event.userId)
				: [...context.assignment.selectedUsers, event.userId];
			return { assignment: { ...context.assignment, selectedUsers: users } };
		}),
		resetFields: assign(() => ({
			...initialFields,
			currentStep: 0,
			error: null,
		})),
		setError: assign(({ event }) => {
			if (event.type !== "SUBMIT") return {};
			return { error: "Validation failed" };
		}),
		clearError: assign({ error: null }),
	},
	guards: {
		canProceed: ({ context }) => {
			switch (context.currentStep) {
				case 0:
					return context.basic.title.trim().length > 0;
				case 1:
					return context.config.goalMapId.length > 0;
				case 2:
					return context.procedure.preTestFormId.length > 0;
				case 3:
					return (
						context.assignment.selectedCohorts.length > 0 ||
						context.assignment.selectedUsers.length > 0
					);
				default:
					return false;
			}
		},
		isFirstStep: ({ context }) => context.currentStep === 0,
		isLastStep: ({ context }) => context.currentStep === 3,
	},
}).createMachine({
	id: "assignmentWizard",
	initial: "basicInfo",
	context: { ...initialFields, currentStep: 0, error: null },
	states: {
		basicInfo: {
			on: {
				NEXT: { guard: "canProceed", target: "config" },
				SET_BASIC: { actions: "assignBasic" },
				RESET: { target: "basicInfo", actions: "resetFields" },
			},
		},
		config: {
			entry: assign({ currentStep: 1 }),
			on: {
				NEXT: { guard: "canProceed", target: "procedure" },
				BACK: { target: "basicInfo" },
				SET_CONFIG: { actions: "assignConfig" },
				RESET: { target: "basicInfo", actions: "resetFields" },
			},
		},
		procedure: {
			entry: assign({ currentStep: 2 }),
			on: {
				NEXT: { guard: "canProceed", target: "assignment" },
				BACK: { target: "config" },
				SET_PROCEDURE: { actions: "assignProcedure" },
				RESET: { target: "basicInfo", actions: "resetFields" },
			},
		},
		assignment: {
			entry: assign({ currentStep: 3 }),
			on: {
				NEXT: { guard: "canProceed", target: "submitting" },
				BACK: { target: "procedure" },
				TOGGLE_COHORT: { actions: "toggleCohort" },
				TOGGLE_USER: { actions: "toggleUser" },
				RESET: { target: "basicInfo", actions: "resetFields" },
			},
		},
		submitting: {
			on: {
				SUCCESS: { target: "done" },
				BACK: { target: "assignment" },
			},
		},
		done: {
			type: "final",
		},
	},
});
