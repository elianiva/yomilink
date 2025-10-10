import { useAuthActions, useAuthToken } from "@convex-dev/auth/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useId, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

const schema = z.object({
	email: z.email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

function LoginPage() {
	const token = useAuthToken();
	const { signIn } = useAuthActions();
	const [step, setStep] = useState<"signIn" | "signUp">("signIn");
	const [error, setError] = useState<string | null>(null);
	const idEmail = useId();
	const idPassword = useId();

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: schema,
			onSubmit: schema,
		},
		onSubmit: async ({ value }) => {
			setError(null);
			const formData = new FormData();
			formData.set("email", value.email);
			formData.set("password", value.password);
			formData.set("flow", step);
			try {
				await signIn("password", formData);
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : "Failed to authenticate";
				setError(msg);
			}
		},
	});

	if (token) {
		return <Navigate to="/" />;
	}

	return (
		<div className="min-h-screen bg-white flex items-center justify-center p-6">
			<div className="w-full max-w-md rounded-2xl border border-border/60 bg-white shadow-sm">
				<div className="p-8 space-y-6">
					<div className="flex items-center gap-3">
						<div className="h-9 w-9 rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
							Y
						</div>
						<div>
							<h1 className="text-2xl font-semibold">Yomilink</h1>
							<p className="text-sm text-muted-foreground">
								{step === "signIn"
									? "Sign in to your account"
									: "Create your account"}
							</p>
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
							form.handleSubmit();
						}}
						className="space-y-5"
					>
						<form.Field name="email">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor={idEmail}>Email</Label>
									<Input
										id={idEmail}
										placeholder="you@example.com"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										inputMode="email"
										autoComplete="email"
									/>
									{field.state.meta.isTouched &&
									field.state.meta.errors.length ? (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									) : null}
								</div>
							)}
						</form.Field>

						<form.Field name="password">
							{(field) => (
								<div className="space-y-1.5">
									<Label htmlFor={idPassword}>Password</Label>
									<Input
										id={idPassword}
										type="password"
										placeholder="********"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
										autoComplete={
											step === "signIn" ? "current-password" : "new-password"
										}
									/>
									{field.state.meta.isTouched &&
									field.state.meta.errors.length ? (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									) : null}
								</div>
							)}
						</form.Field>

						<div className="flex items-center justify-between pt-1">
							<button
								type="button"
								onClick={() => {
									setStep(step === "signIn" ? "signUp" : "signIn");
									setError(null);
								}}
								className="text-sm underline underline-offset-4 hover:opacity-90 transition-opacity text-primary"
							>
								{step === "signIn"
									? "Create an account"
									: "Have an account? Sign in"}
							</button>
							<Link
								to="/"
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
							>
								Back to home
							</Link>
						</div>

						<form.Subscribe
							selector={(s) => [s.canSubmit, s.isSubmitting] as const}
						>
							{([canSubmit, isSubmitting]) => (
								<Button
									type="submit"
									disabled={!canSubmit || isSubmitting}
									className="w-full"
								>
									{isSubmitting
										? step === "signIn"
											? "Signing in..."
											: "Creating account..."
										: step === "signIn"
											? "Sign in"
											: "Create account"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				</div>
				<div className="px-8 pb-6">
					<div className="text-xs text-muted-foreground">
						By continuing, you agree to our Terms and Privacy Policy.
					</div>
				</div>
			</div>
		</div>
	);
}
