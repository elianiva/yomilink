import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			{Icon && (
				<div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
					<Icon className="size-6 text-muted-foreground" />
				</div>
			)}
			<h3 className="font-medium text-foreground mb-1">{title}</h3>
			{description && <p className="text-sm text-muted-foreground max-w-sm">{description}</p>}
			{action && <div className="mt-4">{action}</div>}
		</div>
	);
}
