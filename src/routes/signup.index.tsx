import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountStep } from "@/features/auth/components/account-step";
import { AcademicStep } from "@/features/auth/components/academic-step";
import { ConsentStep } from "@/features/auth/components/consent-step";
import { PersonalStep } from "@/features/auth/components/personal-step";
import { steps, SignUpSchema } from "@/features/auth/types";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { AuthRpc, type SignUpInput } from "@/server/rpc/auth";
import { getMe } from "@/server/rpc/profile";
import { WhitelistRpc } from "@/server/rpc/whitelist";

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
	const [currentStep, setCurrentStep] = useState(0);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
	const [error, setError] = useState<string | null>(null);

	const { data: whitelistData, isLoading: whitelistLoading } = useRpcQuery(
		WhitelistRpc.listUnregistered(),
	);
	const whitelistEntries = whitelistData ?? [];
	const whitelistOptions = whitelistEntries.map((entry) => ({
		id: entry.studentId,
		label: `${entry.name} (${entry.studentId})`,
		description: entry.cohortName ?? undefined,
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
			studyGroup: null as unknown as SignUpInput["studyGroup"],
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
			setError(null);
			const selectedWhitelist = whitelistEntries.find((entry) => entry.studentId === value.studentId);
			if (!selectedWhitelist) {
				setError("Please select a reserved account from the whitelist.");
				return;
			}
			if (!value.consentGiven) {
				setError("Consent is required.");
				return;
			}

			signUpMutation.mutate({
				studentId: selectedWhitelist.studentId,
				password: value.password,
				age: value.age,
				jlptLevel: value.jlptLevel,
				studyGroup: value.studyGroup,
				japaneseLearningDuration: value.japaneseLearningDuration,
				previousJapaneseScore: value.previousJapaneseScore,
				mediaConsumption: value.mediaConsumption,
				motivation: value.motivation,
				consentGiven: value.consentGiven,
			});
		},
	});

	const handleNext = () => {
		setCompletedSteps((prev) => new Set(prev).add(currentStep));
		setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
	};

	const handlePrevious = () => {
		setCurrentStep((step) => Math.max(step - 1, 0));
	};

	const stepComponents = [
		<AccountStep
			key="account"
			form={form}
			whitelistOptions={whitelistOptions}
			isLoading={whitelistLoading}
			onLastFieldSubmit={handleNext}
		/>,
		<PersonalStep key="personal" form={form} onLastFieldSubmit={handleNext} />,
		<AcademicStep key="academic" form={form} onLastFieldSubmit={handleNext} />,
		<ConsentStep key="consent" form={form} onLastFieldSubmit={handleNext} />,
	];

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-6">
			<div className="w-full max-w-lg">
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4 max-w-xs mx-auto">
						{steps.map((step, index) => {
							const StepIcon = step.icon;
							const isCompleted = completedSteps.has(index);
							const isActive = index === currentStep;
							const isPending = index > currentStep;

							return (
								<div key={step.id} className="flex items-center">
									{index > 0 && (
										<div
											className={completedSteps.has(index - 1) ? "w-full h-0.5 mx-2 mb-10 bg-primary" : "w-full h-0.5 mx-2 mb-10 bg-muted"}
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
							<p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
						</div>
					</div>

					{error ? (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{error}
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
								{stepComponents[currentStep]}
							</div>
						</div>
						<div className="flex gap-2 justify-between">
							{currentStep > 0 ? (
								<Button type="button" variant="outline" onClick={handlePrevious}>
									Previous
								</Button>
							) : (
								<div />
							)}

							{currentStep < steps.length - 1 ? (
								<form.Subscribe
									selector={(state) => {
										const { studentId, password, confirmPassword, age, jlptLevel, studyGroup, japaneseLearningDuration, previousJapaneseScore, mediaConsumption } = state.values;
										return {
											step0: {
												filled: !!studentId && !!password && !!confirmPassword,
												errors:
												(state.fieldMeta.studentId?.errors.length ?? 0) +
												(state.fieldMeta.password?.errors.length ?? 0) +
												(state.fieldMeta.confirmPassword?.errors.length ?? 0),
												passwordsMatch: password === confirmPassword,
											},
											step1: {
												filled: age !== null && !!jlptLevel,
												errors:
												(state.fieldMeta.age?.errors.length ?? 0) +
												(state.fieldMeta.jlptLevel?.errors.length ?? 0),
											},
											step2: {
												filled: true,
												errors:
												(state.fieldMeta.studyGroup?.errors.length ?? 0) +
												(state.fieldMeta.japaneseLearningDuration?.errors.length ?? 0) +
												(state.fieldMeta.previousJapaneseScore?.errors.length ?? 0) +
												(state.fieldMeta.mediaConsumption?.errors.length ?? 0) +
												(state.fieldMeta.motivation?.errors.length ?? 0),
											},
											step3: {
												filled: state.values.consentGiven === true,
												errors: state.fieldMeta.consentGiven?.errors.length ?? 0,
											},
										};
									}}
								>
									{(state) => {
										let canProceed = false;
										if (currentStep === 0) {
											canProceed = state.step0.filled && state.step0.errors === 0 && state.step0.passwordsMatch;
										} else if (currentStep === 1) {
											canProceed = state.step1.filled && state.step1.errors === 0;
										} else if (currentStep === 2) {
											canProceed = state.step2.errors === 0;
										} else if (currentStep === 3) {
											canProceed = state.step3.filled && state.step3.errors === 0;
										}

										return (
											<Button type="button" onClick={handleNext} disabled={!canProceed}>
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