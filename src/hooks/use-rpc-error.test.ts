import { describe, expect, it } from "vitest";
import {
	extractData,
	filterArrayResponse,
	getRpcErrorState,
	isErrorResponse,
	isSuccess,
	type RpcErrorResponse,
	type RpcSuccessResponse,
} from "./use-rpc-error";

describe("isErrorResponse", () => {
	it("returns true for valid error response", () => {
		const response: RpcErrorResponse = { success: false, error: "Not found" };
		expect(isErrorResponse(response)).toBe(true);
	});

	it("returns false for success response", () => {
		const response: RpcSuccessResponse<{ id: string }> = {
			success: true,
			id: "123",
		};
		expect(isErrorResponse(response)).toBe(false);
	});

	it("returns false for null", () => {
		expect(isErrorResponse(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isErrorResponse(undefined)).toBe(false);
	});

	it("returns false for non-object values", () => {
		expect(isErrorResponse("error")).toBe(false);
		expect(isErrorResponse(123)).toBe(false);
		expect(isErrorResponse(true)).toBe(false);
	});

	it("returns false for object without success field", () => {
		expect(isErrorResponse({ error: "test" })).toBe(false);
	});

	it("returns false for object with success: false but non-string error", () => {
		expect(isErrorResponse({ success: false, error: 123 })).toBe(false);
		expect(isErrorResponse({ success: false, error: null })).toBe(false);
	});

	it("returns false for array responses", () => {
		expect(isErrorResponse([{ id: "1" }, { id: "2" }])).toBe(false);
	});
});

describe("isSuccess", () => {
	it("returns true for valid success response", () => {
		const response: RpcSuccessResponse<{ id: string }> = {
			success: true,
			id: "123",
		};
		expect(isSuccess(response)).toBe(true);
	});

	it("returns false for error response", () => {
		const response: RpcErrorResponse = { success: false, error: "Not found" };
		expect(isSuccess(response)).toBe(false);
	});

	it("returns false for null", () => {
		expect(isSuccess(null)).toBe(false);
	});

	it("returns false for undefined", () => {
		expect(isSuccess(undefined)).toBe(false);
	});

	it("returns false for non-object values", () => {
		expect(isSuccess("success")).toBe(false);
		expect(isSuccess(123)).toBe(false);
		expect(isSuccess(true)).toBe(false);
	});

	it("returns false for object without success field", () => {
		expect(isSuccess({ id: "123" })).toBe(false);
	});

	it("returns false for array responses", () => {
		expect(isSuccess([{ id: "1" }])).toBe(false);
	});
});

describe("extractData", () => {
	it("extracts data from success response", () => {
		const response: RpcSuccessResponse<{ id: string; name: string }> = {
			success: true,
			id: "123",
			name: "Test",
		};
		expect(extractData(response)).toEqual({ id: "123", name: "Test" });
	});

	it("returns null for error response", () => {
		const response: RpcErrorResponse = { success: false, error: "Not found" };
		expect(extractData(response)).toBeNull();
	});

	it("returns null for null input", () => {
		expect(extractData(null)).toBeNull();
	});

	it("returns null for undefined input", () => {
		expect(extractData(undefined)).toBeNull();
	});

	it("returns raw data if no success field (arrays)", () => {
		const data = [{ id: "1" }, { id: "2" }];
		expect(extractData(data)).toEqual(data);
	});

	it("returns raw object if no success field", () => {
		const data = { id: "123", name: "Test" };
		expect(extractData(data)).toEqual(data);
	});
});

describe("getRpcErrorState", () => {
	it("returns correct state for success response", () => {
		const response: RpcSuccessResponse<{ id: string }> = {
			success: true,
			id: "123",
		};
		const result = getRpcErrorState(response);
		expect(result).toEqual({
			data: { id: "123" },
			error: null,
			isError: false,
			isSuccess: true,
		});
	});

	it("returns correct state for error response", () => {
		const response: RpcErrorResponse = {
			success: false,
			error: "Resource not found",
		};
		const result = getRpcErrorState(response);
		expect(result).toEqual({
			data: null,
			error: "Resource not found",
			isError: true,
			isSuccess: false,
		});
	});

	it("returns correct state for null", () => {
		const result = getRpcErrorState(null);
		expect(result).toEqual({
			data: null,
			error: null,
			isError: false,
			isSuccess: false,
		});
	});

	it("returns correct state for undefined", () => {
		const result = getRpcErrorState(undefined);
		expect(result).toEqual({
			data: null,
			error: null,
			isError: false,
			isSuccess: false,
		});
	});

	it("returns correct state for raw array data", () => {
		const data = [{ id: "1" }, { id: "2" }];
		const result = getRpcErrorState(data);
		expect(result).toEqual({
			data,
			error: null,
			isError: false,
			isSuccess: true,
		});
	});

	it("returns correct state for raw object data", () => {
		const data = { id: "123", name: "Test" };
		const result = getRpcErrorState(data);
		expect(result).toEqual({
			data,
			error: null,
			isError: false,
			isSuccess: true,
		});
	});
});

describe("filterArrayResponse", () => {
	it("returns array from raw array response", () => {
		const data = [{ id: "1" }, { id: "2" }];
		expect(filterArrayResponse(data)).toEqual(data);
	});

	it("returns empty array for error response", () => {
		const response: RpcErrorResponse = { success: false, error: "Not found" };
		expect(filterArrayResponse(response)).toEqual([]);
	});

	it("returns empty array for null", () => {
		expect(filterArrayResponse(null)).toEqual([]);
	});

	it("returns empty array for undefined", () => {
		expect(filterArrayResponse(undefined)).toEqual([]);
	});

	it("extracts items from success response with items field", () => {
		const response = {
			success: true as const,
			items: [{ id: "1" }, { id: "2" }],
		};
		expect(filterArrayResponse(response)).toEqual([{ id: "1" }, { id: "2" }]);
	});

	it("returns empty array for success response without items or array", () => {
		const response = { success: true as const, data: "something" };
		expect(filterArrayResponse(response)).toEqual([]);
	});
});
