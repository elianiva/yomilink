/**
 * Standardized RPC success response format.
 */
export type RpcSuccess<T> = {
	readonly success: true;
	readonly data: T;
};

/**
 * Standardized RPC error response format.
 */
export type RpcError = {
	readonly success: false;
	readonly error: string;
	readonly code?: string;
};

/**
 * Standardized RPC response type (success or error).
 */
export type RpcResult<T> = RpcSuccess<T> | RpcError;
