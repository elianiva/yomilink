import type { AnyFieldApi } from "@tanstack/react-form";

export function FieldInfo({ field }: { field: AnyFieldApi }) {
	const hasTouched = field.state.meta.isTouched;
	const isValid = field.state.meta.isValid;
	return (
		<>
			{hasTouched && !isValid ? (
				<span className="text-xs text-red-500">
					{field.state.meta.errors.map((err) => err.message).join(",")}
				</span>
			) : null}
			{field.state.meta.isValidating ? "Validating..." : null}
		</>
	);
}
