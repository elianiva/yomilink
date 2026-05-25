import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function FormSelect({
	id,
	label,
	value,
	onChange,
	forms,
	placeholder,
	required,
}: {
	id: string;
	label: string;
	value: string;
	onChange: (value: string) => void;
	forms: { id: string; title: string; description: string }[];
	placeholder: string;
	required?: boolean;
}) {
	return (
		<div className="space-y-2">
			<Label htmlFor={id}>
				{label}
				{required && <span className="text-destructive ml-1">*</span>}
			</Label>
			<SearchableSelect
				value={value}
				onChange={onChange}
				options={forms.map((f) => ({
					id: f.id,
					label: f.title,
					description: f.description ?? undefined,
				}))}
				placeholder={placeholder}
				searchPlaceholder={`Search ${label.toLowerCase()}s...`}
			/>
		</div>
	);
}
