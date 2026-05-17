import { toast as sonnerToast } from "sonner";

import { type ErrorCategory, getErrorDetails } from "./error-types";

export type ErrorToastOptions = {
	title?: string;
	operation?: string;
	fallbackMessage?: string;
	showRetry?: boolean;
	onRetry?: () => void;
	duration?: number;
};

export type SuccessToastOptions = {
	title?: string;
	duration?: number;
};

const CATEGORY_TITLES: Record<ErrorCategory, string> = {
	network: "Connection Error",
	"not-found": "Not Found",
	forbidden: "Access Denied",
	validation: "Invalid Input",
	server: "Server Error",
	unknown: "Error",
};

const CATEGORY_DESCRIPTIONS: Record<ErrorCategory, string> = {
	network: "Please check your internet connection and try again.",
	"not-found": "The requested resource could not be found.",
	forbidden: "You don't have permission to perform this action.",
	validation: "Please check your input and try again.",
	server: "Something went wrong on our end. Please try again later.",
	unknown: "An unexpected error occurred. Please try again.",
};

// Converts "deleteAssignment" to "delete assignment"
function formatOperation(operation: string): string {
	return operation
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.trim();
}

function buildDescription(
	errorDetails: ReturnType<typeof getErrorDetails>,
	options: ErrorToastOptions,
): string {
	const { message, category } = errorDetails;
	const { operation, fallbackMessage } = options;

	const defaultCategoryMessage = CATEGORY_DESCRIPTIONS[category];
	const hasSpecificMessage =
		message && message !== defaultCategoryMessage && message !== "An unknown error occurred";

	let description = hasSpecificMessage ? message : defaultCategoryMessage;

	if (operation) {
		const formattedOp = formatOperation(operation);
		description = `Failed to ${formattedOp}. ${description}`;
	}

	if (!description && fallbackMessage) {
		description = fallbackMessage;
	}

	return description;
}

function showError(error: unknown, options: ErrorToastOptions = {}): string {
	const errorDetails = getErrorDetails(error);
	const { title, showRetry, onRetry, duration = 5000 } = options;

	const toastTitle = title || CATEGORY_TITLES[errorDetails.category];
	const description = buildDescription(errorDetails, options);

	const toastId = sonnerToast.error(toastTitle, {
		description,
		duration,
		action:
			showRetry && onRetry
				? {
						label: "Retry",
						onClick: onRetry,
					}
				: undefined,
	});

	return String(toastId);
}

function showSuccess(message: string, options: SuccessToastOptions = {}): string {
	const { title, duration = 3000 } = options;

	const toastId = sonnerToast.success(title || message, {
		description: title ? message : undefined,
		duration,
	});

	return String(toastId);
}

function showInfo(message: string, options: { title?: string; duration?: number } = {}): string {
	const { title, duration = 4000 } = options;

	const toastId = sonnerToast.info(title || message, {
		description: title ? message : undefined,
		duration,
	});

	return String(toastId);
}

function showWarning(message: string, options: { title?: string; duration?: number } = {}): string {
	const { title, duration = 5000 } = options;

	const toastId = sonnerToast.warning(title || message, {
		description: title ? message : undefined,
		duration,
	});

	return String(toastId);
}

function showLoading(message: string): string {
	const toastId = sonnerToast.loading(message);
	return String(toastId);
}

function updateSuccess(
	toastId: string,
	message: string,
	options: { duration?: number } = {},
): void {
	const { duration = 3000 } = options;
	sonnerToast.success(message, {
		id: toastId,
		duration,
	});
}

function updateError(toastId: string, error: unknown, options: ErrorToastOptions = {}): void {
	const errorDetails = getErrorDetails(error);
	const { title, duration = 5000 } = options;

	const toastTitle = title || CATEGORY_TITLES[errorDetails.category];
	const description = buildDescription(errorDetails, options);

	sonnerToast.error(toastTitle, {
		id: toastId,
		description,
		duration,
	});
}

function dismiss(toastId: string): void {
	sonnerToast.dismiss(toastId);
}

function dismissAll(): void {
	sonnerToast.dismiss();
}

export const toast = {
	error: showError,
	success: showSuccess,
	info: showInfo,
	warning: showWarning,
	loading: showLoading,
	updateSuccess,
	updateError,
	dismiss,
	dismissAll,
} as const;
