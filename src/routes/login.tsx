import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { Schema } from "effect";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMe } from "@/server/rpc/profile";

import { authClient } from "../lib/auth-client";

function getFriendlyAuthErrorMessage(err: unknown) {
	const raw = err instanceof Error ? err.message : String(err ?? "");
	const msg = raw.toLowerCase();
	if (msg.includes("invalidsecret") || msg.includes("invalid secret")) {
		return "Incorrect email or password.";
	}
	if (
		msg.includes("accountnotfound") ||
		msg.includes("no account") ||
		msg.includes("unknown identifier")
	) {
		return "Account not found. Check your email.";
	}
	if (msg.includes("rate") && msg.includes("limit")) {
		return "Too many attempts. Please wait a moment and try again.";
	}
	if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
		return "Network error. Check your connection and try again.";
	}

	return "Unable to sign in. Please verify your email and password.";
}

export const Route = createFileRoute("/login")({
	ssr: true,
	beforeLoad: async () => {
		const me = await getMe();
		if (me.success) throw redirect({ to: "/dashboard" });
		return null;
	},
	component: LoginPage,
});

const LoginSchema = Schema.Struct({
	email: Schema.NonEmptyString,
	password: Schema.String.pipe(Schema.minLength(8)),
});

function LoginPage() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		validators: {
			onChange: Schema.standardSchemaV1(LoginSchema),
			onSubmit: Schema.standardSchemaV1(LoginSchema),
		},
		onSubmit: async ({ value }) => {
			setError(null);
			try {
				const { error } = await authClient.signIn.email({
					email: value.email,
					password: value.password,
				});
				if (error) {
					throw new Error(error.message ?? "Sign in failed");
				}
				navigate({ to: "/dashboard" });
			} catch (e: unknown) {
				setError(getFriendlyAuthErrorMessage(e));
			}
		},
	});

	return (
		<div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
			<div className="w-full max-w-md rounded-2xl border border-border/60 bg-white shadow-sm p-8 space-y-6">
				<div className="flex items-center gap-3">
					<div className="h-9 w-9 rounded-lg bg-primary/90 ring-4 ring-primary/10 flex items-center justify-center text-primary-foreground font-bold">
						Y
					</div>
					<div>
						<h1 className="text-2xl font-semibold">KitBuild</h1>
						<p className="text-sm text-muted-foreground">Sign in to your account</p>
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
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									placeholder="you@example.com"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
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
								<Input
									id="password"
									type="password"
									placeholder="********"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									autoComplete="current-password"
								/>
								<FieldInfo field={field} />
							</div>
						)}
					</form.Field>

					<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
						{([canSubmit, isSubmitting]) => (
							<Button
								type="submit"
								disabled={!canSubmit || isSubmitting}
								className="w-full"
							>
								{isSubmitting ? "Signing in..." : "Sign in"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</div>
			<div className="text-center pt-4">
				<p className="text-sm text-muted-foreground">
					Don&apos;t have an account?{" "}
					<Link to="/signup" className="text-primary hover:underline font-medium">
						Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}
