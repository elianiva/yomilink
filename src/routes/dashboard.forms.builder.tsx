import { createFileRoute } from "@tanstack/react-router";
import { FilePlusIcon } from "lucide-react";
import { Guard } from "@/components/auth/Guard";

export const Route = createFileRoute("/dashboard/forms/builder")({
	component: () => (
		<Guard roles={["teacher", "admin"]}>
			<FormBuilderPage />
		</Guard>
	),
});

function FormBuilderPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<FilePlusIcon className="size-6 text-primary" />
					<div>
						<h1 className="text-2xl font-semibold">Create New Form</h1>
						<p className="text-muted-foreground">
							Build a new form with questions and configuration
						</p>
					</div>
				</div>
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2 space-y-6">
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-lg font-medium mb-4">Form Content</h2>
						<p className="text-sm text-muted-foreground">
							Form content editor will be implemented here
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<div className="rounded-lg border bg-card p-6">
						<h2 className="text-lg font-medium mb-4">Form Settings</h2>
						<p className="text-sm text-muted-foreground">
							Form metadata and configuration will be implemented here
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
