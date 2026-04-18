import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { PasswordInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";

interface AccountStepProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	form: any;
	whitelistOptions: SearchableSelectOption[];
	isLoading?: boolean;
	onLastFieldSubmit?: () => void;
}

export function AccountStep({ form, whitelistOptions, isLoading, onLastFieldSubmit }: AccountStepProps) {
	return (
		<fieldset className="space-y-5">
			<form.Field name="studentId">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="studentId">Reserved Account</Label>
						{isLoading ? (
							<div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
								Loading whitelist...
							</div>
						) : whitelistOptions.length === 0 ? (
							<div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
								No whitelist entries available.
							</div>
						) : (
							<SearchableSelect
								id="studentId"
								value={field.state.value}
								onChange={(value) => field.handleChange(value)}
								options={whitelistOptions}
								placeholder="Search your name or student ID"
								searchPlaceholder="Search Name (ID)..."
							/>
						)}
						<p className="text-xs text-muted-foreground">
							Choose your reserved entry from the whitelist.
						</p>
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
