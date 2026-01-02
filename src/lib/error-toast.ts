import { toast as sonnerToast } from "sonner";
import { type ErrorCategory, getErrorDetails } from "./error-types";

/**
 * Configuration options for error toasts.
 */
export type ErrorToastOptions = {
	/** Custom title for the toast (default: based on error category) */
	title?: string;
	/** Operation name for context (e.g., "delete assignment", "save goal map") */
	operation?: string;
	/** Fallback message if error message is empty */
	fallbackMessage?: string;
	/** Whether to show a retry button */
	showRetry?: boolean;
	/** Callback when retry is clicked */
	onRetry?: () => void;
	/** Duration in milliseconds (default: 5000) */
	duration?: number;
};

/**
 * Configuration options for success toasts.
 */
export type SuccessToastOptions = {
	/** Custom title for the toast */
	title?: string;
	/** Duration in milliseconds (default: 3000) */
	duration?: number;
};

/**
 * Default titles by error category.
 */
const CATEGORY_TITLES: Record<ErrorCategory, string> = {
	network: "Connection Error",
	"not-found": "Not Found",
	forbidden: "Access Denied",
	validation: "Invalid Input",
	server: "Server Error",
	unknown: "Error",
};

/**
 * User-friendly descriptions by error category.
 */
const CATEGORY_DESCRIPTIONS: Record<ErrorCategory, string> = {
	network: "Please check your internet connection and try again.",
	"not-found": "The requested resource could not be found.",
	forbidden: "You don't have permission to perform this action.",
	validation: "Please check your input and try again.",
	server: "Something went wrong on our end. Please try again later.",
	unknown: "An unexpected error occurred. Please try again.",
};

/**
 * Formats an operation name for display in error messages.
 * Converts "deleteAssignment" to "delete assignment".
 */
function formatOperation(operation: string): string {
	return operation
		.replace(/([A-Z])/g, " $1")
		.toLowerCase()
		.trim();
}

/**
 * Builds a description message based on error details and context.
 */
function buildDescription(
	errorDetails: ReturnType<typeof getErrorDetails>,
	options: ErrorToastOptions,
): string {
	const { message, category } = errorDetails;
	const { operation, fallbackMessage } = options;

	// If we have a specific error message that's not the default, use it
	const defaultCategoryMessage = CATEGORY_DESCRIPTIONS[category];
	const hasSpecificMessage =
		message &&
		message !== defaultCategoryMessage &&
		message !== "An unknown error occurred";

	let description = hasSpecificMessage ? message : defaultCategoryMessage;

	// Add operation context if provided
	if (operation) {
		const formattedOp = formatOperation(operation);
		description = `Failed to ${formattedOp}. ${description}`;
	}

	// Use fallback if description is empty
	if (!description && fallbackMessage) {
		description = fallbackMessage;
	}

	return description;
}

/**
 * Shows an error toast with user-friendly messaging.
 *
 * @example
 * ```ts
 * // Basic usage
 * toast.error(error);
 *
 * // With operation context
 * toast.error(error, { operation: "deleteAssignment" });
 *
 * // With retry callback
 * toast.error(error, {
 *   operation: "saveGoalMap",
 *   showRetry: true,
 *   onRetry: () => saveMutation.mutate()
 * });
 * ```
 */
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

/**
 * Shows a success toast with consistent styling.
 *
 * @example
 * ```ts
 * toast.success("Assignment created successfully");
 *
 * toast.success("Changes saved", { title: "Success" });
 * ```
 */
function showSuccess(
	message: string,
	options: SuccessToastOptions = {},
): string {
	const { title, duration = 3000 } = options;

	const toastId = sonnerToast.success(title || message, {
		description: title ? message : undefined,
		duration,
	});

	return String(toastId);
}

/**
 * Shows an info toast.
 *
 * @example
 * ```ts
 * toast.info("Your changes will be saved automatically");
 * ```
 */
function showInfo(
	message: string,
	options: { title?: string; duration?: number } = {},
): string {
	const { title, duration = 4000 } = options;

	const toastId = sonnerToast.info(title || message, {
		description: title ? message : undefined,
		duration,
	});

	return String(toastId);
}

/**
 * Shows a warning toast.
 *
 * @example
 * ```ts
 * toast.warning("This action cannot be undone");
 * ```
 */
function showWarning(
	message: string,
	options: { title?: string; duration?: number } = {},
): string {
	const { title, duration = 5000 } = options;

	const toastId = sonnerToast.warning(title || message, {
		description: title ? message : undefined,
		duration,
	});

	return String(toastId);
}

/**
 * Shows a loading toast that can be updated.
 *
 * @example
 * ```ts
 * const toastId = toast.loading("Saving changes...");
 * try {
 *   await saveChanges();
 *   toast.updateSuccess(toastId, "Changes saved!");
 * } catch (error) {
 *   toast.updateError(toastId, error);
 * }
 * ```
 */
function showLoading(message: string): string {
	const toastId = sonnerToast.loading(message);
	return String(toastId);
}

/**
 * Updates a toast to show success.
 */
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

/**
 * Updates a toast to show an error.
 */
function updateError(
	toastId: string,
	error: unknown,
	options: ErrorToastOptions = {},
): void {
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

/**
 * Dismisses a toast by ID.
 */
function dismiss(toastId: string): void {
	sonnerToast.dismiss(toastId);
}

/**
 * Dismisses all toasts.
 */
function dismissAll(): void {
	sonnerToast.dismiss();
}

/**
 * Grouped toast API for centralized error handling.
 *
 * @example
 * ```ts
 * // Error toast
 * toast.error(error);
 * toast.error(error, { operation: "delete assignment" });
 *
 * // Success toast
 * toast.success("Assignment created successfully");
 *
 * // Info toast
 * toast.info("Your changes will be saved automatically");
 *
 * // Warning toast
 * toast.warning("This action cannot be undone");
 *
 * // Loading toast with update
 * const id = toast.loading("Saving...");
 * toast.updateSuccess(id, "Saved!");
 * ```
 */
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
