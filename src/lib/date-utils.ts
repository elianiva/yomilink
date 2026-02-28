const dateFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

export function formatDate(timestamp: number | Date | string): string {
	const date =
		typeof timestamp === "number"
			? new Date(timestamp)
			: typeof timestamp === "string"
				? new Date(timestamp)
				: timestamp;
	return dateFormatter.format(date);
}

export function formatDateTime(timestamp: number | Date | string): string {
	const date =
		typeof timestamp === "number"
			? new Date(timestamp)
			: typeof timestamp === "string"
				? new Date(timestamp)
				: timestamp;
	return dateTimeFormatter.format(date);
}

export function formatRelativeTime(timestamp: number | Date | string): string {
	const now = new Date();
	const then =
		typeof timestamp === "number"
			? new Date(timestamp)
			: typeof timestamp === "string"
				? new Date(timestamp)
				: timestamp;
	const diffMs = now.getTime() - then.getTime();

	if (diffMs < 0) {
		return formatDate(then);
	}

	const diffSecs = Math.floor(diffMs / 1000);
	const diffMins = Math.floor(diffSecs / 60);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSecs < 60) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

	return formatDate(then);
}

export function parseDateInput(dateStr: string | undefined): number | undefined {
	if (!dateStr) return undefined;
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return undefined;
	return date.getTime();
}

export function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}
