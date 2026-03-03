import { format, formatDistanceToNow } from "date-fns";

export function formatDate(timestamp: number | Date | string): string {
	const date =
		typeof timestamp === "number"
			? new Date(timestamp)
			: typeof timestamp === "string"
				? new Date(timestamp)
				: timestamp;
	return format(date, "MMM d, yyyy");
}

export function formatDateTime(timestamp: number | Date | string): string {
	const date =
		typeof timestamp === "number"
			? new Date(timestamp)
			: typeof timestamp === "string"
				? new Date(timestamp)
				: timestamp;
	return format(date, "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(timestamp: number | Date | string): string {
	const date =
		typeof timestamp === "number"
			? new Date(timestamp)
			: typeof timestamp === "string"
				? new Date(timestamp)
				: timestamp;
	return formatDistanceToNow(date, { addSuffix: true });
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
