import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { UserIcon, BookOpenIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldInfo } from "@/components/ui/field-info";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "@/components/ui/password-strength";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useRpcMutation } from "@/hooks/use-rpc-query";
import { cn } from "@/lib/utils";
import { AuthRpc, type SignUpInput, JlptLevelSchema } from "@/server/rpc/auth";
import { getMe } from "@/server/rpc/profile";

export const Route = createFileRoute("/signup")({
	ssr: true,
	beforeLoad: async () => {
		const me = await getMe();
		if (me.success) throw redirect({ to: "/dashboard" });
		return null;
	},
	component: SignUpPage,
});

// Animation variants - direction determines slide direction
// direction = 1 (next): new slides in from right, old slides out to left
// direction = -1 (prev): new slides in from left, old slides out to right
const stepVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 100 : -100,
		opacity: 0,
	}),
	center: {
		x: 0,
		opacity: 1,
	},
	exit: (direction: number) => ({
		x: direction > 0 ? -100 : 100,
		opacity: 0,
	}),
};

const jlptOptions = [
	{ id: "None", label: "None (No JLPT)" },
	{ id: "N5", label: "N5 (Beginner)" },
	{ id: "N4", label: "N4 (Elementary)" },
	{ id: "N3", label: "N3 (Intermediate)" },
	{ id: "N2", label: "N2 (Pre-Advanced)" },
	{ id: "N1", label: "N1 (Advanced)" },
];

const SignUpSchema = Schema.Struct({
	name: Schema.NonEmptyString,
	email: Schema.NonEmptyString,
	password: Schema.String.pipe(
		Schema.minLength(8),
		Schema.pattern(/[A-Z]/, {
			message: () => "Password must include at least one uppercase letter",
		}),
		Schema.pattern(/[a-z]/, {
			message: () => "Password must include at least one lowercase letter",
		}),
		Schema.pattern(/[0-9]|[^A-Za-z0-9]/, {
			message: () => "Password must include at least one number or special character",
		}),
	),
	confirmPassword: Schema.String,
	age: Schema.NullOr(Schema.Number),
	jlptLevel: JlptLevelSchema,
	japaneseLearningDuration: Schema.NullOr(Schema.Number),
	previousJapaneseScore: Schema.NullOr(Schema.Number),
	mediaConsumption: Schema.NullOr(Schema.Number),
	motivation: Schema.NullOr(Schema.String),
}).pipe(
	Schema.filter((data) => data.password === data.confirmPassword, {
		message: () => "Passwords do not match",
	}),
);

type Step = {
	id: "account" | "personal";
	title: string;
	description: string;
	icon: typeof UserIcon;
};

const steps: Step[] = [
	{
		id: "account",
		title: "Account Information",
		description: "Create your login credentials",
		icon: UserIcon,
	},
	{
		id: "personal",
		title: "Personal Information",
		description: "Tell us about your Japanese learning journey",
		icon: BookOpenIcon,
	},
];

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
			jlptLevel: "None" as SignUpInput["jlptLevel"],
			japaneseLearningDuration: null as unknown as number | null,
			previousJapaneseScore: null as unknown as number | null,
			mediaConsumption: null as unknown as number | null,
			motivation: null as unknown as string | null,
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
				jlptLevel: value.jlptLevel,
				japaneseLearningDuration: value.japaneseLearningDuration,
				previousJapaneseScore: value.previousJapaneseScore,
				mediaConsumption: value.mediaConsumption,
				motivation: value.motivation,
			});
		},
	});

	const handleNext = (e: React.MouseEvent) => {
		e.preventDefault();
		setCompletedSteps((prev) => new Set(prev).add(currentStep));
		setStep([Math.min(currentStep + 1, steps.length - 1), 1]);
	};

	const handlePrevious = () => {
		setStep([Math.max(currentStep - 1, 0), -1]);
	};

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
								{currentStep === 0 && (
									<motion.div
										key="account"
										custom={direction}
										variants={stepVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.1, ease: "easeOut" }}
									>
										<fieldset className="space-y-5">
											<form.Field name="name">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="name">Full Name</Label>
														<Input
															id="name"
															placeholder="Enter your full name"
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															onBlur={field.handleBlur}
															autoComplete="name"
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>

											<form.Field name="email">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="email">Email</Label>
														<Input
															id="email"
															placeholder="you@example.com"
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															onBlur={field.handleBlur}
															inputMode="email"
															autoComplete="email"
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>

											<form.Field name="password">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="password">Password</Label>
														<PasswordInput
															id="password"
															placeholder="Minimum 8 characters"
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															onBlur={field.handleBlur}
															autoComplete="new-password"
														/>
														<FieldInfo field={field} />
														<PasswordStrength
															password={field.state.value}
														/>
													</div>
												)}
											</form.Field>

											<form.Field name="confirmPassword">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="confirmPassword">
															Confirm Password
														</Label>
														<PasswordInput
															id="confirmPassword"
															placeholder="Re-enter your password"
															value={field.state.value}
															onChange={(e) =>
																field.handleChange(e.target.value)
															}
															onBlur={field.handleBlur}
															autoComplete="new-password"
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>
										</fieldset>
									</motion.div>
								)}

								{currentStep === 1 && (
									<motion.div
										key="personal"
										custom={direction}
										variants={stepVariants}
										initial="enter"
										animate="center"
										exit="exit"
										transition={{ duration: 0.1, ease: "easeOut" }}
									>
										<fieldset className="space-y-5">
											<div className="grid grid-cols-12 gap-4">
												<form.Field name="age">
													{(field) => (
														<div className="space-y-1.5 col-span-4">
															<Label htmlFor="age">Age</Label>
															<Input
																id="age"
																type="number"
																placeholder="e.g., 20"
																value={field.state.value ?? ""}
																onChange={(e) =>
																	field.handleChange(
																		e.target.value
																			? Number(e.target.value)
																			: null,
																	)
																}
																onBlur={field.handleBlur}
																min="1"
																max="120"
															/>
															<FieldInfo field={field} />
														</div>
													)}
												</form.Field>

												<form.Field name="jlptLevel">
													{(field) => (
														<div className="space-y-1.5 col-span-8">
															<Label htmlFor="jlptLevel">
																JLPT Level
															</Label>
															<SearchableSelect
																value={field.state.value}
																onChange={(value) =>
																	field.handleChange(
																		value as SignUpInput["jlptLevel"],
																	)
																}
																options={jlptOptions}
																placeholder="Select level"
																searchPlaceholder="Search JLPT level..."
															/>
															<FieldInfo field={field} />
														</div>
													)}
												</form.Field>
											</div>

											<form.Field name="japaneseLearningDuration">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="japaneseLearningDuration">
															Months Learning Japanese
														</Label>
														<Input
															id="japaneseLearningDuration"
															type="number"
															placeholder="e.g., 12"
															value={field.state.value ?? ""}
															onChange={(e) =>
																field.handleChange(
																	e.target.value
																		? Number(e.target.value)
																		: null,
																)
															}
															onBlur={field.handleBlur}
															min="0"
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>

											<form.Field name="previousJapaneseScore">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="previousJapaneseScore">
															Previous Japanese Score (if any)
														</Label>
														<Input
															id="previousJapaneseScore"
															type="number"
															placeholder="e.g., 75"
															value={field.state.value ?? ""}
															onChange={(e) =>
																field.handleChange(
																	e.target.value
																		? Number(e.target.value)
																		: null,
																)
															}
															onBlur={field.handleBlur}
															min="0"
															max="100"
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>

											<form.Field name="mediaConsumption">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="mediaConsumption">
															Hours/Week Consuming Japanese Media
														</Label>
														<Input
															id="mediaConsumption"
															type="number"
															placeholder="e.g., 5"
															value={field.state.value ?? ""}
															onChange={(e) =>
																field.handleChange(
																	e.target.value
																		? Number(e.target.value)
																		: null,
																)
															}
															onBlur={field.handleBlur}
															min="0"
															step="0.5"
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>

											<form.Field name="motivation">
												{(field) => (
													<div className="space-y-1.5">
														<Label htmlFor="motivation">
															What motivates you to learn Japanese?
														</Label>
														<Textarea
															id="motivation"
															placeholder="Share your motivation..."
															value={field.state.value ?? ""}
															onChange={(e) =>
																field.handleChange(
																	e.target.value || null,
																)
															}
															onBlur={field.handleBlur}
															rows={3}
														/>
														<FieldInfo field={field} />
													</div>
												)}
											</form.Field>
										</fieldset>
									</motion.div>
								)}
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
										const { name, email, password, confirmPassword } =
											state.values;
										return {
											nameFilled: !!name,
											emailFilled: !!email,
											passwordFilled: !!password,
											confirmFilled: !!confirmPassword,
											nameErrors: state.fieldMeta.name?.errors.length ?? 0,
											emailErrors: state.fieldMeta.email?.errors.length ?? 0,
											passwordErrors:
												state.fieldMeta.password?.errors.length ?? 0,
											confirmErrors:
												state.fieldMeta.confirmPassword?.errors.length ?? 0,
											passwordsMatch: password === confirmPassword,
										};
									}}
								>
									{(state) => {
										const canProceed =
											state.nameFilled &&
											state.emailFilled &&
											state.passwordFilled &&
											state.confirmFilled &&
											state.nameErrors === 0 &&
											state.emailErrors === 0 &&
											state.passwordErrors === 0 &&
											state.confirmErrors === 0 &&
											state.passwordsMatch;
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
