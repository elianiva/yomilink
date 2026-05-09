import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
	return <div className="p-2 text-xs text-muted-foreground">{children}</div>;
}
