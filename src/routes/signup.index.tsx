import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { useReducer } from "react";

import { Button } from "@/components/ui/button";
import { AcademicStep } from "@/features/auth/components/academic-step";
import { AccountStep } from "@/features/auth/components/account-step";
import { ConsentStep } from "@/features/auth/components/consent-step";
import { PersonalStep } from "@/features/auth/components/personal-step";
import { steps, SignUpSchema } from "@/features/auth/types";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AuthRpc, type SignUpInput } from "@/server/rpc/auth";
import { getMe } from "@/server/rpc/profile";
import { WhitelistRpc } from "@/server/rpc/whitelist";

type SignUpStepSnapshot = {
	account: {
		filled: boolean;
		errors: number;
		passwordsMatch: boolean;
	};
	personal: {
		filled: boolean;
		errors: number;
	};
	academic: {
		filled: boolean;
		errors: number;
	};
	consent: {
		filled: boolean;
		errors: number;
	};
};

type SignUpMachineState = {
	step: number;
	completed: Set<number>;
	error: string | null;
};

type SignUpMachineEvent =
	| { type: "next" }
	| { type: "previous" }
	| { type: "setError"; message: string }
	| { type: "clearError" };

type StepRenderProps = {
	form: any;
	whitelistOptions: Array<{ id: string; label: string }>;
	whitelistLoading: boolean;
	cohorts: Array<{ id: string; label: string }>;
	onLastFieldSubmit?: () => void;
};

function createSignUpMachineState(): SignUpMachineState {
	return {
		step: 0,
		completed: new Set<number>(),
		error: null,
	};
}

function signUpMachineReducer(state: SignUpMachineState, event: SignUpMachineEvent): SignUpMachineState {
	switch (event.type) {
		case "next": {
			const nextStep = Math.min(state.step + 1, signupSteps.length - 1);
			return {
				step: nextStep,
				completed: new Set(state.completed).add(state.step),
				error: null,
			};
		}
		case "previous":
			return {
				...state,
				step: Math.max(state.step - 1, 0),
				error: null,
			};
		case "setError":
			return {
				...state,
				error: event.message,
			};
		case "clearError":
			return {
				...state,
				error: null,
			};
		default:
			return state;
	}
}

function selectSignUpStepSnapshot(state: any): SignUpStepSnapshot {
	const { studentId, password, confirmPassword, age, jlptLevel, cohortId } = state.values;

	return {
		account: {
			filled: !!studentId && !!password && !!confirmPassword,
			errors:
				(state.fieldMeta.studentId?.errors.length ?? 0) +
				(state.fieldMeta.password?.errors.length ?? 0) +
				(state.fieldMeta.confirmPassword?.errors.length ?? 0),
			passwordsMatch: password === confirmPassword,
		},
		personal: {
			filled: age !== null && !!jlptLevel,
			errors: (state.fieldMeta.age?.errors.length ?? 0) + (state.fieldMeta.jlptLevel?.errors.length ?? 0),
		},
		academic: {
			filled: !!cohortId,
			errors: state.fieldMeta.cohortId?.errors.length ?? 0,
		},
		consent: {
			filled: state.values.consentGiven === true,
			errors: state.fieldMeta.consentGiven?.errors.length ?? 0,
		},
	};
}

const signupSteps = [
	{
		...steps[0],
		guard: (snapshot: SignUpStepSnapshot) =>
			snapshot.account.filled && snapshot.account.errors === 0 && snapshot.account.passwordsMatch,
		render: ({ form, whitelistOptions, whitelistLoading, onLastFieldSubmit }: StepRenderProps) => (
			<AccountStep form={form} whitelistOptions={whitelistOptions} isLoading={whitelistLoading} onLastFieldSubmit={onLastFieldSubmit} />
		),
	},
	{
		...steps[1],
		guard: (snapshot: SignUpStepSnapshot) => snapshot.personal.filled && snapshot.personal.errors === 0,
		render: ({ form, onLastFieldSubmit }: StepRenderProps) => (
			<PersonalStep form={form} onLastFieldSubmit={onLastFieldSubmit} />
		),
	},
	{
		...steps[2],
		guard: (snapshot: SignUpStepSnapshot) => snapshot.academic.filled && snapshot.academic.errors === 0,
		render: ({ form, cohorts, onLastFieldSubmit }: StepRenderProps) => (
			<AcademicStep form={form} cohorts={cohorts} onLastFieldSubmit={onLastFieldSubmit} />
		),
	},
	{
		...steps[3],
		guard: (snapshot: SignUpStepSnapshot) => snapshot.consent.filled && snapshot.consent.errors === 0,
		render: ({ form, onLastFieldSubmit }: StepRenderProps) => (
			<ConsentStep form={form} onLastFieldSubmit={onLastFieldSubmit} />
		),
	},
] as const;

export const Route = createFileRoute("/signup/")({
	ssr: true,
	beforeLoad: async () => {
		const me = await getMe();
		if (me?.success) {
			const target = me.data.role === "student" ? "/dashboard/assignments" : "/dashboard";
			throw redirect({ to: target });
		}
		return null;
	},
	component: SignUpPage,
});

function SignUpPage() {
	const navigate = useNavigate();
	const [machine, dispatch] = useReducer(signUpMachineReducer, undefined, createSignUpMachineState);

	const { data: whitelistData, isLoading: whitelistLoading } = useRpcQuery(WhitelistRpc.listUnregistered());
	const { data: cohortsData } = useRpcQuery(AuthRpc.listCohorts());

	const whitelistEntries = whitelistData ?? [];
	const whitelistOptions = whitelistEntries.map((entry) => ({
		id: entry.studentId,
		label: `${entry.name} (${entry.studentId})`,
	}));
	const cohorts = (cohortsData ?? []).map((cohort) => ({
		id: cohort.id,
		label: cohort.name,
	}));

	const signUpMutation = useRpcMutation(AuthRpc.signUp(), {
		showSuccess: true,
		successMessage: "Account created successfully!",
		showError: true,
		onSuccess: () => {
			void navigate({ to: "/login" });
		},
	});

	const form = useForm({
		defaultValues: {
			studentId: "",
			password: "",
			confirmPassword: "",
			age: null as unknown as number | null,
			jlptLevel: "None" as SignUpInput["jlptLevel"],
			cohortId: "",
			japaneseLearningDuration: null as unknown as number | null,
			previousJapaneseScore: null as unknown as number | null,
			mediaConsumption: null as unknown as number | null,
			motivation: null as unknown as string | null,
			consentGiven: false,
		},
		validators: {
			onChange: Schema.standardSchemaV1(SignUpSchema),
			onSubmit: Schema.standardSchemaV1(SignUpSchema),
		},
		onSubmit: ({ value }) => {
			dispatch({ type: "clearError" });

			const selectedWhitelist = whitelistEntries.find((entry) => entry.studentId === value.studentId);
			if (!selectedWhitelist) {
				dispatch({ type: "setError", message: "Please select a reserved account from the whitelist." });
				return;
			}
			if (!value.consentGiven) {
				dispatch({ type: "setError", message: "Consent is required." });
				return;
			}

			signUpMutation.mutate({
				studentId: selectedWhitelist.studentId,
				password: value.password,
				age: value.age,
				jlptLevel: value.jlptLevel,
				cohortId: value.cohortId,
				japaneseLearningDuration: value.japaneseLearningDuration,
				previousJapaneseScore: value.previousJapaneseScore,
				mediaConsumption: value.mediaConsumption,
				motivation: value.motivation,
				consentGiven: value.consentGiven,
			});
		},
	});

	const currentStep = machine.step;
	const currentStepMeta = signupSteps[currentStep];

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-6">
			<div className="w-full max-w-lg">
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4 max-w-xs mx-auto">
						{signupSteps.map((step, index) => {
							const StepIcon = step.icon;
							const isCompleted = machine.completed.has(index);
							const isActive = index === currentStep;
							const isPending = index > currentStep;

							return (
								<div key={step.id} className="flex items-center">
									{index > 0 && (
										<div
											className={
												machine.completed.has(index - 1)
													? "w-full h-0.5 mx-2 mb-10 bg-primary"
													: "w-full h-0.5 mx-2 mb-10 bg-muted"
												}
										/>
									)}
									<div className={isPending ? "flex flex-col items-center opacity-50" : "flex flex-col items-center"}>
										<div
											className={
												isActive
												? "h-10 w-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground ring-4 ring-primary/10"
												: isCompleted
													? "h-10 w-10 rounded-full flex items-center justify-center bg-primary/80 text-primary-foreground"
													: "h-10 w-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground"
											}
										>
											<StepIcon className="h-5 w-5" />
										</div>
										<span className={isActive ? "text-xs mt-2 font-medium text-primary" : "text-xs mt-2 font-medium text-muted-foreground"}>
											{step.title}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden h-150 flex flex-col p-8 space-y-6">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
							KB
						</div>
						<div>
							<h1 className="text-2xl font-semibold">KitBuild</h1>
							<p className="text-sm text-muted-foreground">{currentStepMeta.description}</p>
						</div>
					</div>

					{machine.error ? (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{machine.error}
						</div>
					) : null}

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							void form.handleSubmit();
						}}
						className="flex flex-col flex-1"
					>
						<div className="space-y-5 relative flex-1">
							<div className="pr-2 overflow-visible">
								{currentStepMeta.render({
									form,
									whitelistOptions,
									whitelistLoading,
									cohorts,
									onLastFieldSubmit: currentStep < signupSteps.length - 1 ? () => dispatch({ type: "next" }) : undefined,
								})}
							</div>
						</div>
						<div className="flex gap-2 justify-between">
							{currentStep > 0 ? (
								<Button type="button" variant="outline" onClick={() => dispatch({ type: "previous" })}>
									Previous
								</Button>
							) : (
								<div />
							)}

							{currentStep < signupSteps.length - 1 ? (
								<form.Subscribe selector={selectSignUpStepSnapshot}>
									{(snapshot) => {
										const canProceed = signupSteps[currentStep].guard(snapshot);

										return (
											<Button type="button" onClick={() => dispatch({ type: "next" })} disabled={!canProceed}>
												Next
											</Button>
										);
									}}
								</form.Subscribe>
							) : (
								<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
									{([canSubmit, isSubmitting]) => (
										<Button type="submit" disabled={!canSubmit || isSubmitting || signUpMutation.isPending}>
											{signUpMutation.isPending ? "Creating account..." : "Create Account"}
										</Button>
									)}
								</form.Subscribe>
							)}
						</div>
					</form>
				</div>
				<div className="text-center mt-4">
					<p className="text-sm text-muted-foreground">
						Already have an account?{" "}
						<Link to="/login" className="text-primary hover:underline font-medium">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
