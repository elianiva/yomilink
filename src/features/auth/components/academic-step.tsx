import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface Cohort {
	id: string;
	label: string;
}

interface AcademicStepProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	form: any;
	cohorts: Cohort[];
}

export function AcademicStep({ form, cohorts }: AcademicStepProps) {
	return (
		<fieldset className="space-y-5">
			<form.Field name="cohortId">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="cohortId">Select Your Cohort</Label>
						<SearchableSelect
							value={field.state.value}
							onChange={(value) => field.handleChange(value)}
							options={cohorts}
							placeholder="Search cohorts..."
							searchPlaceholder="Search cohort name..."
						/>
						<p className="text-xs text-muted-foreground">
							Choose the class assigned by your instructor.
						</p>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>

			<form.Field name="studentId">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="studentId">Student ID</Label>
						<Input
							id="studentId"
							placeholder="Enter your student ID"
							value={field.state.value ?? ""}
							onChange={(e) => field.handleChange(e.target.value || null)}
							onBlur={field.handleBlur}
							autoComplete="off"
						/>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>
		</fieldset>
	);
}
