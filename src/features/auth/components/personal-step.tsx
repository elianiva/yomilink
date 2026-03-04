import type { AnyFieldApi } from "@tanstack/react-form";

import { FieldInfo } from "@/components/ui/field-info";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { SignUpInput } from "@/server/rpc/auth";

import { jlptOptions } from "../types";

interface PersonalStepProps {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	form: any;
}

export function PersonalStep({ form }: PersonalStepProps) {
	return (
		<fieldset className="space-y-5">
			<div className="grid grid-cols-12 gap-4">
				<form.Field name="age">
					{(field: AnyFieldApi) => (
						<div className="space-y-1.5 col-span-4">
							<Label htmlFor="age">Age</Label>
							<Input
								id="age"
								type="number"
								placeholder="e.g., 20"
								value={field.state.value ?? ""}
								onChange={(e) =>
									field.handleChange(
										e.target.value ? Number(e.target.value) : null,
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
					{(field: AnyFieldApi) => (
						<div className="space-y-1.5 col-span-8">
							<Label htmlFor="jlptLevel">JLPT Level</Label>
							<SearchableSelect
								value={field.state.value}
								onChange={(value) =>
									field.handleChange(value as SignUpInput["jlptLevel"])
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
						/>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>

			<form.Field name="previousJapaneseScore">
				{(field: AnyFieldApi) => (
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
						<Label htmlFor="mediaConsumption">
							Hours/Week Consuming Japanese Media
						</Label>
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
						<Textarea
							id="motivation"
							placeholder="Share your motivation..."
							value={field.state.value ?? ""}
							onChange={(e) => field.handleChange(e.target.value || null)}
							onBlur={field.handleBlur}
							rows={3}
						/>
						<FieldInfo field={field} />
					</div>
				)}
			</form.Field>
		</fieldset>
	);
}
