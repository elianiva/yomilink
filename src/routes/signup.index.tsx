import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AcademicStep } from "@/features/auth/components/academic-step";
import { AccountStep } from "@/features/auth/components/account-step";
import { ConsentStep } from "@/features/auth/components/consent-step";
import { PersonalStep } from "@/features/auth/components/personal-step";
import { stepVariants, steps, SignUpSchema } from "@/features/auth/types";
import { useRpcMutation, useRpcQuery } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { AuthRpc, type SignUpInput } from "@/server/rpc/auth";
import { getMe } from "@/server/rpc/profile";

export const Route = createFileRoute("/signup/")({
	ssr: true,
	beforeLoad: async () => {
		const me = await getMe();
		if (me.success) {
			const target = me.data.role === "student" ? "/dashboard/assignments" : "/dashboard";
			throw redirect({ to: target });
		}
		return null;
	},
	component: SignUpPage,
});

function SignUpPage() {
	const navigate = useNavigate();
	const [[currentStep, direction], setStep] = useState([0, 0]);
	const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
	const signUpMutation = useRpcMutation(AuthRpc.signUp(), {
		showSuccess: true,
		successMessage: "Account created successfully!",
		showError: true,
		onSuccess: () => {
			navigate({ to: "/login" });
		},
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
			age: null as unknown as number | null,
			studentId: null as unknown as string | null,
			jlptLevel: "None" as SignUpInput["jlptLevel"],
			cohortId: "",
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
			signUpMutation.mutate({
				name: value.name,
				email: value.email,
				password: value.password,
				age: value.age,
				studentId: value.studentId,
				jlptLevel: value.jlptLevel,
				cohortId: value.cohortId,
				studyGroup: null,
				japaneseLearningDuration: value.japaneseLearningDuration,
				previousJapaneseScore: value.previousJapaneseScore,
				mediaConsumption: value.mediaConsumption,
				motivation: value.motivation,
				consentGiven: value.consentGiven,
			});
		},
	});

	const { data: cohortsData } = useRpcQuery(AuthRpc.listCohorts());
	const cohorts = (cohortsData ?? []).map((c) => ({
		id: c.id,
		label: c.name,
	}));

	const handleNext = (e: React.MouseEvent) => {
		e.preventDefault();
		setCompletedSteps((prev) => new Set(prev).add(currentStep));
		setStep([Math.min(currentStep + 1, steps.length - 1), 1]);
	};

	const handlePrevious = () => {
		setStep([Math.max(currentStep - 1, 0), -1]);
	};

	const stepComponents = [
		<AccountStep key="account" form={form} />,
		<PersonalStep key="personal" form={form} />,
		<AcademicStep key="academic" form={form} cohorts={cohorts} />,
		<ConsentStep key="consent" form={form} />,
	];

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-6">
			<div className="w-full max-w-lg">
				{/* Progress Steps */}
				<div className="mb-8">
					<div className="flex items-center justify-between mb-4 max-w-xs mx-auto">
						{steps.map((step, index) => {
							const StepIcon = step.icon;
							const isCompleted = completedSteps.has(index);
							const isActive = index === currentStep;
							const isPending = index > currentStep;

							return (
								<>
									{index > 0 && (
										<div
											className={cn(
												"w-full h-0.5 mx-2 mb-10",
												isCompleted ? "bg-primary" : "bg-muted",
											)}
										/>
									)}
									<div key={step.id} className="flex items-center">
										<div
											className={cn(
												"flex flex-col items-center",
												isPending ? "opacity-50" : "",
											)}
										>
											<div
												className={cn(
													"h-10 w-10 rounded-full flex items-center justify-center",
													isActive
														? "bg-primary text-primary-foreground ring-4 ring-primary/10"
														: isCompleted
															? "bg-primary/80 text-primary-foreground"
															: "bg-muted text-muted-foreground",
												)}
											>
												<StepIcon className="h-5 w-5" />
											</div>
											<span
												className={cn(
													"text-xs mt-2 font-medium text-center",
													isActive
														? "text-primary"
														: "text-muted-foreground",
												)}
											>
												{step.title}
											</span>
										</div>
									</div>
								</>
							);
						})}
					</div>
				</div>

				{/* Form Card */}
				<div className="rounded-2xl border border-border/60 bg-white shadow-sm overflow-hidden h-150 flex flex-col p-8 space-y-6">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
							KB
						</div>
						<div>
							<h1 className="text-2xl font-semibold">KitBuild</h1>
							<p className="text-sm text-muted-foreground">
								{steps[currentStep].description}
							</p>
						</div>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="flex flex-col flex-1"
					>
						<div className="space-y-5 relative flex-1">
							<AnimatePresence mode="wait" custom={direction} initial={false}>
								<motion.div
									key={currentStep}
									custom={direction}
									variants={stepVariants}
									initial="enter"
									animate="center"
									exit="exit"
									transition={{ duration: 0.1, ease: "easeOut" }}
								>
									{stepComponents[currentStep]}
								</motion.div>
							</AnimatePresence>
						</div>
						{/* Navigation */}
						<div className="flex gap-2 justify-between">
							{currentStep > 0 ? (
								<Button
									type="button"
									variant="outline"
									onClick={handlePrevious}
									disabled={currentStep === 0}
								>
									<ChevronLeft className="h-4 w-4 mr-1" />
									Previous
								</Button>
							) : (
								<div />
							)}

							{currentStep < steps.length - 1 ? (
								<form.Subscribe
									selector={(state) => {
										const {
											name,
											email,
											password,
											confirmPassword,
											age,
											jlptLevel,
											japaneseLearningDuration,
											mediaConsumption,
										} = state.values;
										return {
											step0: {
												filled:
													!!name &&
													!!email &&
													!!password &&
													!!confirmPassword,
												errors:
													(state.fieldMeta.name?.errors.length ?? 0) +
													(state.fieldMeta.email?.errors.length ?? 0) +
													(state.fieldMeta.password?.errors.length ?? 0) +
													(state.fieldMeta.confirmPassword?.errors
														.length ?? 0),
												passwordsMatch: password === confirmPassword,
											},
											step1: {
												filled:
													age !== null &&
													!!jlptLevel &&
													japaneseLearningDuration !== null &&
													mediaConsumption !== null,
												errors:
													(state.fieldMeta.age?.errors.length ?? 0) +
													(state.fieldMeta.jlptLevel?.errors.length ??
														0) +
													(state.fieldMeta.japaneseLearningDuration
														?.errors.length ?? 0) +
													(state.fieldMeta.mediaConsumption?.errors
														.length ?? 0),
											},
											step2: {
												filled: !!state.values.cohortId,
												errors:
													state.fieldMeta.cohortId?.errors.length ?? 0,
											},
											step3: {
												filled: state.values.consentGiven === true,
												errors:
													state.fieldMeta.consentGiven?.errors.length ?? 0,
											},
										};
									}}
								>
									{(state) => {
										let canProceed = false;
										if (currentStep === 0) {
											canProceed =
												state.step0.filled &&
												state.step0.errors === 0 &&
												state.step0.passwordsMatch;
										} else if (currentStep === 1) {
											canProceed =
												state.step1.filled && state.step1.errors === 0;
										} else if (currentStep === 2) {
											canProceed =
												state.step2.filled && state.step2.errors === 0;
										} else if (currentStep === 3) {
											canProceed =
												state.step3.filled && state.step3.errors === 0;
										}

										return (
											<Button
												type="button"
												onClick={handleNext}
												disabled={!canProceed}
											>
												Next
												<ChevronRight className="h-4 w-4 ml-1" />
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
				</div>
				{/* Login Link */}
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
