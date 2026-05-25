import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, description, action }: PageHeaderProps) {
	return (
		<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
			<div className="flex items-center gap-3 min-w-0">
				{Icon && <Icon className="size-6 text-primary shrink-0" />}
				<div className="min-w-0">
					<h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate font-heading">
						{title}
					</h1>
					{description && (
						<p className="text-sm text-muted-foreground truncate">{description}</p>
					)}
				</div>
			</div>
			{action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
		</div>
	);
}
