import { assign, setup } from "xstate";

export type SignUpStep = "account" | "personal" | "academic" | "consent";

export interface SignUpMachineContext {
	step: number;
	completed: number[];
	error: string | null;
}

export type SignUpMachineEvent =
	| { type: "NEXT" }
	| { type: "PREVIOUS" }
	| { type: "SET_ERROR"; message: string }
	| { type: "CLEAR_ERROR" };

const STEPS: SignUpStep[] = ["account", "personal", "academic", "consent"];

export const signUpMachine = setup({
	types: {
		context: {} as SignUpMachineContext,
		events: {} as SignUpMachineEvent,
	},
	guards: {
		canGoNext: ({ context }) => context.step < STEPS.length - 1,
		canGoBack: ({ context }) => context.step > 0,
	},
	actions: {
		goToNext: assign(({ context }) => ({
			step: Math.min(context.step + 1, STEPS.length - 1),
			completed: [...context.completed, context.step],
			error: null,
		})),
		goToPrevious: assign(({ context }) => ({
			step: Math.max(context.step - 1, 0),
			error: null,
		})),
		setError: assign(({ context, event }) => ({
			error: event.type === "SET_ERROR" ? event.message : context.error,
		})),
		clearError: assign({ error: null }),
	},
}).createMachine({
	id: "signUp",
	initial: "active",
	context: {
		step: 0,
		completed: [],
		error: null,
	},
	states: {
		active: {
			on: {
				NEXT: {
					guard: "canGoNext",
					actions: "goToNext",
				},
				PREVIOUS: {
					guard: "canGoBack",
					actions: "goToPrevious",
				},
				SET_ERROR: {
					actions: "setError",
				},
				CLEAR_ERROR: {
					actions: "clearError",
				},
			},
		},
	},
});
