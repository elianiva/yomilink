import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

import { studyGroupOptions } from "../types";

interface AcademicStepProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	form: any;
	onLastFieldSubmit?: () => void;
}

export function AcademicStep({ form, onLastFieldSubmit }: AcademicStepProps) {
	return (
		<fieldset className="space-y-5">
			<form.Field name="studyGroup">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="studyGroup">Study Group</Label>
						<SearchableSelect
							id="studyGroup"
							value={field.state.value ?? "unassigned"}
							onChange={(value) =>
								field.handleChange(value === "unassigned" ? null : value)
							}
							options={studyGroupOptions}
							placeholder="Select a group"
							searchPlaceholder="Search study group..."
						/>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>

			<form.Field name="japaneseLearningDuration">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="japaneseLearningDuration">Months Learning Japanese</Label>
						<Input
							id="japaneseLearningDuration"
							type="number"
							placeholder="e.g., 12"
							value={field.state.value ?? ""}
							onChange={(e) =>
								field.handleChange(e.target.value ? Number(e.target.value) : null)
							}
							onBlur={field.handleBlur}
							min="0"
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

			<form.Field name="previousJapaneseScore">
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="previousJapaneseScore">Previous Japanese Score (if any)</Label>
						<Input
							id="previousJapaneseScore"
							type="number"
							placeholder="e.g., 75"
							value={field.state.value ?? ""}
							onChange={(e) =>
								field.handleChange(e.target.value ? Number(e.target.value) : null)
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
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="mediaConsumption">Hours/Week Consuming Japanese Media</Label>
						<Input
							id="mediaConsumption"
							type="number"
							placeholder="e.g., 5"
							value={field.state.value ?? ""}
							onChange={(e) =>
								field.handleChange(e.target.value ? Number(e.target.value) : null)
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
				{(field: AnyFieldApi) => (
					<div className="space-y-1.5">
						<Label htmlFor="motivation">What motivates you to learn Japanese?</Label>
						<Input
							id="motivation"
							placeholder="Share your motivation..."
							value={field.state.value ?? ""}
							onChange={(e) => field.handleChange(e.target.value || null)}
							onBlur={field.handleBlur}
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
