import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import type * as React from "react";
import { Component, useCallback, useEffect, useRef } from "react";

import { getErrorDetails } from "@/lib/error-types";

import { ErrorCard } from "./ui/error-card";

export type QueryErrorBoundaryProps = {
	children: React.ReactNode;
	fallback?: React.ReactNode | ((props: FallbackProps) => React.ReactNode);
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
	onReset?: () => void;
	resetKeys?: unknown[];
	errorTitle?: string;
};

export type FallbackProps = {
	error: Error;
	resetErrorBoundary: () => void;
	isResetting: boolean;
};

type ErrorBoundaryState = {
	error: Error | null;
	isResetting: boolean;
};

class ErrorBoundaryClass extends Component<
	QueryErrorBoundaryProps & {
		onResetQuery: () => void;
		resetKeysRef: React.MutableRefObject<unknown[] | undefined>;
	},
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = {
		error: null,
		isResetting: false,
	};

	static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
		return { error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.props.onError?.(error, errorInfo);
	}

	componentDidUpdate(
		_prevProps: QueryErrorBoundaryProps & {
			onResetQuery: () => void;
			resetKeysRef: React.MutableRefObject<unknown[] | undefined>;
		},
	) {
		const { resetKeys } = this.props;
		const { error } = this.state;

		if (error && resetKeys) {
			const prevResetKeys = this.props.resetKeysRef.current;
			const hasChanged =
				prevResetKeys &&
				(prevResetKeys.length !== resetKeys.length ||
					prevResetKeys.some((key, index) => key !== resetKeys[index]));

			if (hasChanged) {
				this.resetErrorBoundary();
			}
		}

		this.props.resetKeysRef.current = resetKeys;
	}

	resetErrorBoundary = () => {
		const { onReset, onResetQuery } = this.props;

		this.setState({ isResetting: true });

		onResetQuery();

		onReset?.();

		setTimeout(() => {
			this.setState({ error: null, isResetting: false });
		}, 100);
	};

	render() {
		const { error, isResetting } = this.state;
		const { children, fallback, errorTitle } = this.props;

		if (error) {
			if (fallback) {
				if (typeof fallback === "function") {
					return fallback({
						error,
						resetErrorBoundary: this.resetErrorBoundary,
						isResetting,
					});
				}
				return fallback;
			}

			const errorDetails = getErrorDetails(error);
			return (
				<ErrorCard
					title={errorTitle || "Something went wrong"}
					description={errorDetails.message}
					onRetry={this.resetErrorBoundary}
					isRetrying={isResetting}
				/>
			);
		}

		return children;
	}
}

export function QueryErrorBoundary({
	children,
	fallback,
	onError,
	onReset,
	resetKeys,
	errorTitle,
}: QueryErrorBoundaryProps) {
	const { reset: resetQuery } = useQueryErrorResetBoundary();
	const resetKeysRef = useRef<unknown[] | undefined>(resetKeys);

	useEffect(() => {
		resetKeysRef.current = resetKeys;
	}, [resetKeys]);

	const handleResetQuery = useCallback(() => {
		resetQuery();
	}, [resetQuery]);

	return (
		<ErrorBoundaryClass
			fallback={fallback}
			onError={onError}
			onReset={onReset}
			resetKeys={resetKeys}
			errorTitle={errorTitle}
			onResetQuery={handleResetQuery}
			resetKeysRef={resetKeysRef}
		>
			{children}
		</ErrorBoundaryClass>
	);
}

export function useQueryErrorBoundaryReset() {
	const { reset } = useQueryErrorResetBoundary();
	return reset;
}
