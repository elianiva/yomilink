import { useStore } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useMachine } from "@xstate/react";
import { Schema } from "effect";

import { Button } from "@/components/ui/button";
import { AcademicStep } from "@/features/auth/components/academic-step";
import { AccountStep } from "@/features/auth/components/account-step";
import { ConsentStep } from "@/features/auth/components/consent-step";
import { PersonalStep } from "@/features/auth/components/personal-step";
import { useAppForm } from "@/features/auth/components/use-app-form";
import { steps, SignUpSchema } from "@/features/auth/types";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { extractFormErrorMessages } from "@/lib/form-error-messages";
import { cn } from "@/lib/utils";
import { signUpMachine } from "@/machines/signup.machine";
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

type SelectOption = { id: string; label: string };

type StepRenderProps = {
	whitelistOptions: Array<SelectOption>;
	whitelistLoading: boolean;
	cohorts: Array<SelectOption>;
	preselectedCohortName: string | null;
	onLastFieldSubmit?: () => void;
};

type FormSubscribeState = { errors: unknown };

type WhitelistEntry = { studentId: string; cohortId: string | null };

type FormSnapshotState = {
	values: Record<string, unknown>;
	fieldMeta: Record<string, { errors: unknown[] }>;
};

type FormSnapshotValues = {
	studentId: string;
	password: string;
	confirmPassword: string;
	age: number | null;
	jlptLevel: string;
	cohortId: string;
};

function selectSignUpStepSnapshot(
	state: FormSnapshotState,
	whitelistEntries: Array<WhitelistEntry>,
): SignUpStepSnapshot {
	const { studentId, password, confirmPassword, age, jlptLevel, cohortId } =
		state.values as FormSnapshotValues;

	const whitelistCohortId = studentId
		? whitelistEntries.find((e) => e.studentId === studentId)?.cohortId
		: null;
	const effectiveCohortId = cohortId || whitelistCohortId || "";

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
			errors:
				(state.fieldMeta.age?.errors.length ?? 0) +
				(state.fieldMeta.jlptLevel?.errors.length ?? 0),
		},
		academic: {
			filled: !!effectiveCohortId,
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
			snapshot.account.filled &&
			snapshot.account.errors === 0 &&
			snapshot.account.passwordsMatch,
		render: ({ whitelistOptions, whitelistLoading, onLastFieldSubmit }: StepRenderProps) => (
			<AccountStep
				whitelistOptions={whitelistOptions}
				isLoading={whitelistLoading}
				onLastFieldSubmit={onLastFieldSubmit}
			/>
		),
	},
	{
		...steps[1],
		guard: (snapshot: SignUpStepSnapshot) =>
			snapshot.personal.filled && snapshot.personal.errors === 0,
		render: ({ onLastFieldSubmit }: StepRenderProps) => (
			<PersonalStep onLastFieldSubmit={onLastFieldSubmit} />
		),
	},
	{
		...steps[2],
		guard: (snapshot: SignUpStepSnapshot) =>
			snapshot.academic.filled && snapshot.academic.errors === 0,
		render: ({ cohorts, preselectedCohortName, onLastFieldSubmit }: StepRenderProps) => (
			<AcademicStep
				cohorts={cohorts}
				preselectedCohortName={preselectedCohortName}
				onLastFieldSubmit={onLastFieldSubmit}
			/>
		),
	},
	{
		...steps[3],
		guard: (snapshot: SignUpStepSnapshot) =>
			snapshot.consent.filled && snapshot.consent.errors === 0,
		render: ({ onLastFieldSubmit }: StepRenderProps) => (
			<ConsentStep onLastFieldSubmit={onLastFieldSubmit} />
		),
	},
] as const;

export const Route = createFileRoute("/signup/")({
	ssr: true,
	head: () => ({
		meta: [{ title: "Sign Up - KitBuild" }],
	}),
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
	const [snapshot, send] = useMachine(signUpMachine);

	const { data: whitelistData, isLoading: whitelistLoading } = useRpcQuery(
		WhitelistRpc.listUnregistered(),
	);
	const { data: cohortsData } = useRpcQuery(AuthRpc.listCohorts());

	const whitelistEntries = whitelistData ?? [];
	const whitelistOptions = whitelistEntries
		.slice()
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((entry) => ({
			id: entry.studentId,
			label: `${entry.name} (${entry.studentId})`,
			group: entry.cohortName ?? undefined,
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

	const form = useAppForm({
		defaultValues: {
			studentId: "",
			password: "",
			confirmPassword: "",
			age: null as number | null,
			jlptLevel: "None" as SignUpInput["jlptLevel"],
			cohortId: "",
			japaneseLearningDuration: null as number | null,
			previousJapaneseScore: null as number | null,
			mediaConsumption: null as number | null,
			motivation: null as string | null,
			consentGiven: false,
		},
		validators: {
			onChange: Schema.standardSchemaV1(SignUpSchema),
			onSubmit: Schema.standardSchemaV1(SignUpSchema),
		},
		onSubmit: ({ value }) => {
			send({ type: "CLEAR_ERROR" });

			const selectedWhitelist = whitelistEntries.find(
				(entry) => entry.studentId === value.studentId,
			);
			if (!selectedWhitelist) {
				send({
					type: "SET_ERROR",
					message: "Please select a reserved account from the whitelist.",
				});
				return;
			}
			if (!value.consentGiven) {
				send({ type: "SET_ERROR", message: "Consent is required." });
				return;
			}

			const effectiveCohortId = value.cohortId || selectedWhitelist.cohortId;
			if (!effectiveCohortId) {
				send({
					type: "SET_ERROR",
					message: "No cohort assigned. Please contact your teacher.",
				});
				return;
			}

			signUpMutation.mutate({
				studentId: selectedWhitelist.studentId,
				password: value.password,
				age: value.age,
				jlptLevel: value.jlptLevel,
				cohortId: effectiveCohortId,
				japaneseLearningDuration: value.japaneseLearningDuration,
				previousJapaneseScore: value.previousJapaneseScore,
				mediaConsumption: value.mediaConsumption,
				motivation: value.motivation,
				consentGiven: value.consentGiven,
			});
		},
	});

	const currentStudentId = useStore(form.store, (state) => state.values.studentId);
	const formCohortId = useStore(form.store, (state) => state.values.cohortId);
	const whitelistEntry = currentStudentId
		? whitelistEntries.find((e) => e.studentId === currentStudentId)
		: null;
	const preselectedCohortName =
		whitelistEntry?.cohortId && !formCohortId ? whitelistEntry.cohortName : null;

	const currentStep = snapshot.context.step;
	const currentStepMeta = signupSteps[currentStep];

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-4 md:p-6">
			<div className="w-full max-w-lg">
				{/* Stepper — full version on desktop, dots on mobile */}
				<div className="mb-8">
					{/* Mobile: simple dot stepper */}
					<div className="flex items-center justify-center gap-3 md:hidden">
						{signupSteps.map((step, index) => {
							const StepIcon = step.icon;
							const isCompleted = snapshot.context.completed.includes(index);
							const isActive = index === currentStep;
							return (
								<div key={step.id} className="flex items-center">
									{index > 0 && (
										<div
											className={cn(
												"w-6 h-0.5 -mt-6",
												snapshot.context.completed.includes(index - 1)
													? "bg-primary"
													: "bg-muted",
											)}
										/>
									)}
									<div className="flex flex-col items-center">
										<div
											className={cn(
												"size-8 rounded-full flex items-center justify-center transition-colors",
												isActive &&
													"bg-primary text-primary-foreground ring-4 ring-primary/10",
												isCompleted &&
													!isActive &&
													"bg-primary/80 text-primary-foreground",
												!isActive &&
													!isCompleted &&
													"bg-muted text-muted-foreground",
											)}
										>
											<StepIcon className="size-4" />
										</div>
										<span
											className={cn(
												"text-[10px] mt-1.5 font-medium",
												isActive ? "text-primary" : "text-muted-foreground",
											)}
										>
											{step.title}
										</span>
									</div>
								</div>
							);
						})}
					</div>
					{/* Desktop: full stepper with connector lines */}
					<div className="hidden md:flex items-center justify-between mb-4 max-w-xs mx-auto">
						{signupSteps.map((step, index) => {
							const StepIcon = step.icon;
							const isCompleted = snapshot.context.completed.includes(index);
							const isActive = index === currentStep;
							const isPending = index > currentStep;

							return (
								<div key={step.id} className="flex items-center">
									{index > 0 && (
										<div
											className={cn(
												"w-full h-0.5 mx-2 mb-10",
												snapshot.context.completed.includes(index - 1)
													? "bg-primary"
													: "bg-muted",
											)}
										/>
									)}
									<div
										className={cn(
											"flex flex-col items-center",
											isPending && "opacity-50",
										)}
									>
										<div
											className={cn(
												"size-10 rounded-full flex items-center justify-center",
												isActive &&
													"bg-primary text-primary-foreground ring-4 ring-primary/10",
												isCompleted &&
													!isActive &&
													"bg-primary/80 text-primary-foreground",
												!isActive &&
													!isCompleted &&
													"bg-muted text-muted-foreground",
											)}
										>
											<StepIcon className="size-5" />
										</div>
										<span
											className={cn(
												"text-xs mt-2 font-medium",
												isActive ? "text-primary" : "text-muted-foreground",
											)}
										>
											{step.title}
										</span>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden flex flex-col p-6 md:p-8 gap-y-6">
					<div className="flex items-center gap-3">
						<div className="size-9 rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
							KB
						</div>
						<div>
							<h1 className="text-2xl font-semibold">KitBuild</h1>
							<p className="text-sm text-muted-foreground">
								{currentStepMeta.description}
							</p>
						</div>
					</div>

					{snapshot.context.error ? (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{snapshot.context.error}
						</div>
					) : null}

					<form.Subscribe
						selector={(s: FormSubscribeState) => extractFormErrorMessages(s.errors)}
					>
						{(messages) =>
							messages.length > 0 ? (
								<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{messages.join(", ")}
								</div>
							) : null
						}
					</form.Subscribe>

					<form.AppForm>
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
										whitelistOptions,
										whitelistLoading,
										cohorts,
										preselectedCohortName,
										onLastFieldSubmit:
											currentStep < signupSteps.length - 1
												? () => send({ type: "NEXT" })
												: undefined,
									})}
								</div>
							</div>
							<div className="flex gap-2 justify-between">
								{currentStep > 0 ? (
									<Button
										type="button"
										variant="outline"
										onClick={() => send({ type: "PREVIOUS" })}
									>
										Previous
									</Button>
								) : (
									<div />
								)}

								{currentStep < signupSteps.length - 1 ? (
									<form.Subscribe
										selector={(state) =>
											selectSignUpStepSnapshot(state, whitelistEntries)
										}
									>
										{(snap) => {
											const canProceed = signupSteps[currentStep].guard(snap);

											return (
												<Button
													type="button"
													onClick={() => send({ type: "NEXT" })}
													disabled={!canProceed}
												>
													Next
												</Button>
											);
										}}
									</form.Subscribe>
								) : (
									<form.Subscribe
										selector={(s) => [s.canSubmit, s.isSubmitting] as const}
									>
										{([canSubmit, isSubmitting]) => (
											<Button
												type="submit"
												disabled={
													!canSubmit ||
													isSubmitting ||
													signUpMutation.isPending
												}
											>
												{signUpMutation.isPending
													? "Creating account..."
													: "Create Account"}
											</Button>
										)}
									</form.Subscribe>
								)}
							</div>
						</form>
					</form.AppForm>
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
