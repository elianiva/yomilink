import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { useSignUpForm } from "./signup-form.context";

interface AcademicStepProps {
	cohorts: Array<{ id: string; label: string }>;
	preselectedCohortName?: string | null;
	onLastFieldSubmit?: () => void;
}

export function AcademicStep({
	cohorts,
	preselectedCohortName,
	onLastFieldSubmit: _onLastFieldSubmit,
}: AcademicStepProps) {
	const form = useSignUpForm();
	return (
		<fieldset className="space-y-5">
			<form.Field name="studentId">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="studentId">Student ID</Label>
						<Input id="studentId" value={field.state.value ?? ""} readOnly disabled />
						<p className="text-xs text-muted-foreground">
							Please double check your student ID before proceeding.
						</p>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>

			<form.Field name="cohortId">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="cohortId">Cohort</Label>
						{preselectedCohortName ? (
							<div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
								{preselectedCohortName}
							</div>
						) : (
							<SearchableSelect
								id="cohortId"
								value={field.state.value}
								onChange={(value) => field.handleChange(value)}
								options={cohorts}
								placeholder="Select your cohort"
								searchPlaceholder="Search cohort..."
							/>
						)}
						<p className="text-xs text-muted-foreground">
							{preselectedCohortName
								? "Your cohort was automatically assigned from the whitelist."
								: "If you're unsure, please ask your teacher."}
						</p>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>
		</fieldset>
	);
}
