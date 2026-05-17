import type { RpcError, RpcResult, RpcSuccess } from "@/lib/rpc-types";

export function isError(response: unknown): response is RpcError {
	if (response === null || response === undefined) {
		return false;
	}
	if (typeof response !== "object") {
		return false;
	}
	const obj = response as Record<string, unknown>;
	return obj.success === false && typeof obj.error === "string";
}

export function isSuccess<T>(response: unknown): response is RpcSuccess<T> {
	if (response === null || response === undefined) {
		return false;
	}
	if (typeof response !== "object") {
		return false;
	}
	const obj = response as Record<string, unknown>;
	return obj.success === true && "data" in obj;
}

export function unwrap<T>(response: RpcResult<T> | null | undefined): T | null {
	if (response === null || response === undefined) {
		return null;
	}

	if (isError(response)) {
		return null;
	}

	if (isSuccess<T>(response)) {
		return response.data;
	}

	return null;
}

export type RpcState<T> = {
	data: T | undefined;
	error: string | undefined;
	code: string | undefined;
	isError: boolean;
	isSuccess: boolean;
	isLoading: boolean;
};

export function getRpcState<T>(response: RpcResult<T> | null | undefined): RpcState<T> {
	if (response === null || response === undefined) {
		return {
			data: undefined,
			error: undefined,
			code: undefined,
			isError: false,
			isSuccess: false,
			isLoading: true,
		};
	}

	if (isError(response)) {
		return {
			data: undefined,
			error: response.error,
			code: response.code,
			isError: true,
			isSuccess: false,
			isLoading: false,
		};
	}

	const data = unwrap(response);
	return {
		data: data ?? undefined,
		error: undefined,
		code: undefined,
		isError: false,
		isSuccess: true,
		isLoading: false,
	};
}

export function filterArrayResponse<T>(response: unknown): T[] {
	if (response === null || response === undefined) {
		return [];
	}

	if (isError(response)) {
		return [];
	}

	if (isSuccess<{ items: T[] }>(response) && Array.isArray(response.data.items)) {
		return response.data.items;
	}

	if (isSuccess<T[]>(response) && Array.isArray(response.data)) {
		return response.data;
	}

	if (Array.isArray(response)) {
		return response as T[];
	}

	return [];
}
