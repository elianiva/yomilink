import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
	return <div className="px-2 py-2 text-xs text-muted-foreground">{children}</div>;
}
