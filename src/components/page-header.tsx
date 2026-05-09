import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
}

export function PageHeader({ icon: Icon, title, description, action }: PageHeaderProps) {
	return (
		<div className="flex items-center justify-between gap-4">
			<div className="flex items-center gap-3 min-w-0">
				{Icon && <Icon className="size-6 text-primary shrink-0" />}
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold tracking-tight truncate">{title}</h1>
					{description && (
						<p className="text-sm text-muted-foreground truncate">{description}</p>
					)}
				</div>
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
