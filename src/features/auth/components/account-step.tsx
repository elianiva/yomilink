import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { Input, PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { PasswordStrength } from "@/components/ui/password-strength";

interface AccountStepProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	form: any;
	onLastFieldSubmit?: () => void;
}

export function AccountStep({ form, onLastFieldSubmit }: AccountStepProps) {
	return (
		<fieldset className="space-y-5">
			<form.Field name="name">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="name">Full Name</Label>
						<Input
							id="name"
							placeholder="Enter your full name"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							autoComplete="name"
						/>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>

			<form.Field name="email">
				{(field: AnyFieldApi) => (
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
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="password">Password</Label>
						<PasswordInput
							id="password"
							placeholder="Minimum 8 characters"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							autoComplete="new-password"
						/>
						<FieldInfo field={field} />
						{/* <PasswordStrength password={field.state.value} /> */}
					</div>
				)}
			</form.Field>

			<form.Field name="confirmPassword">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<PasswordInput
							id="confirmPassword"
							placeholder="Re-enter your password"
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
							onBlur={field.handleBlur}
							autoComplete="new-password"
							onKeyDown={(e) => {
								if (e.key === "Enter" && onLastFieldSubmit) {
									onLastFieldSubmit();
								}
							}}
						/>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>
		</fieldset>
	);
}
