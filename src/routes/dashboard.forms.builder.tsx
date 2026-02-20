import { createFileRoute } from "@tanstack/react-router";
import { Guard } from "@/components/auth/Guard";
import { FormBuilderPage } from "@/features/form-builder/form-builder-page";
import type { SearchParams } from "@/features/form-builder/types";

export const Route = createFileRoute("/dashboard/forms/builder")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<FormBuilderPage />
		</Guard>
	),
	validateSearch: (search: Record<string, unknown>): SearchParams => ({
		formId: search.formId as string | undefined,
	}),
});
