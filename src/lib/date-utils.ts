import { format, formatDistanceToNow } from "date-fns";

function toDate(timestamp: number | Date | string): Date {
	if (typeof timestamp === "number") return new Date(timestamp);
	if (typeof timestamp === "string") return new Date(timestamp);
	return timestamp;
}

export function formatDate(timestamp: number | Date | string): string {
	return format(toDate(timestamp), "MMM d, yyyy");
}

export function formatDateTime(timestamp: number | Date | string): string {
	return format(toDate(timestamp), "MMM d, yyyy h:mm a");
}

export function formatRelativeTime(timestamp: number | Date | string): string {
	return formatDistanceToNow(toDate(timestamp), { addSuffix: true });
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
