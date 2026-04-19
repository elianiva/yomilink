import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface AcademicStepProps {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    form: any;
    cohorts: Array<{ id: string; label: string }>;
    onLastFieldSubmit?: () => void;
}

export function AcademicStep({ form, cohorts, onLastFieldSubmit }: AcademicStepProps) {
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
                        <SearchableSelect
                            id="cohortId"
                            value={field.state.value}
                            onChange={(value) => field.handleChange(value)}
                            options={cohorts}
                            placeholder="Select your cohort"
                            searchPlaceholder="Search cohort..."
                        />
                        <p className="text-xs text-muted-foreground">
                            If you're unsure, please ask your teacher.
                        </p>
                        <FieldInfo field={field} />
                    </div>
                )}
            </form.Field>
        </fieldset>
    );
}
