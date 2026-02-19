import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as useFormUnlockModule from "@/hooks/use-form-unlock";
import { RestrictiveFormGuard } from "./restrictive-form-guard";

vi.mock("@/hooks/use-form-unlock", () => ({
	useFormUnlock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () =>
		vi.fn((opts: { to: string }) => {
			return opts.to;
		}),
}));

describe("RestrictiveFormGuard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders children when form is unlocked", async () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: false,
			data: {
				isUnlocked: true,
				reason: null,
				earliestUnlockAt: null,
			},
			isUnlocked: true,
			reason: null,
			earliestUnlockAt: null,
			status: {
				isUnlocked: true,
				reason: null,
				earliestUnlockAt: null,
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("children")).toBeInTheDocument();
		});
	});

	it("shows loading state while checking form status", () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: true,
			isError: false,
			data: undefined,
			isUnlocked: false,
			reason: null,
			earliestUnlockAt: null,
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		expect(screen.queryByTestId("children")).not.toBeInTheDocument();
		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
	});

	it("shows error state when fetch fails", () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: true,
			data: undefined,
			isUnlocked: false,
			reason: null,
			earliestUnlockAt: null,
			status: {
				isUnlocked: false,
				reason: null,
				earliestUnlockAt: null,
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		expect(screen.queryByTestId("children")).not.toBeInTheDocument();
		expect(
			screen.getByText(/Failed to check form status/i),
		).toBeInTheDocument();
	});

	it("shows blocked message when form is locked without redirect URL", async () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: false,
			data: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			reason: "Complete registration form first",
			earliestUnlockAt: null,
			status: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Form Required/i)).toBeInTheDocument();
			expect(
				screen.getByText(/Complete registration form first/i),
			).toBeInTheDocument();
		});
	});

	it("shows blocked message with button when redirect URL is provided", async () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: false,
			data: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			reason: "Complete registration form first",
			earliestUnlockAt: null,
			status: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1" redirectUrl="/forms/registration">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Form Required/i)).toBeInTheDocument();
			expect(
				screen.getByText(/Complete registration form first/i),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /Complete Form/i }),
			).toBeInTheDocument();
		});
	});

	it("renders children when enabled is false", () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: false,
			data: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			reason: "Complete registration form first",
			earliestUnlockAt: null,
			status: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1" enabled={false}>
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		expect(screen.getByTestId("children")).toBeInTheDocument();
	});

	it("renders children when formId is not provided", () => {
		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: false,
			data: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			reason: "Complete registration form first",
			earliestUnlockAt: null,
			status: {
				isUnlocked: false,
				reason: "Complete registration form first",
				earliestUnlockAt: null,
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		expect(screen.getByTestId("children")).toBeInTheDocument();
	});

	it("shows earliest unlock time when available", async () => {
		const futureDate = new Date();
		futureDate.setDate(futureDate.getDate() + 7);

		vi.mocked(useFormUnlockModule.useFormUnlock).mockReturnValue({
			isLoading: false,
			isError: false,
			data: {
				isUnlocked: false,
				reason: "Complete prerequisite form first",
				earliestUnlockAt: futureDate.toISOString(),
			},
			isUnlocked: false,
			reason: "Complete prerequisite form first",
			earliestUnlockAt: futureDate.toISOString(),
			status: {
				isUnlocked: false,
				reason: "Complete prerequisite form first",
				earliestUnlockAt: futureDate.toISOString(),
			},
		} as unknown as ReturnType<typeof useFormUnlockModule.useFormUnlock>);

		render(
			<RestrictiveFormGuard formId="form-1">
				<div data-testid="children">Protected Content</div>
			</RestrictiveFormGuard>,
		);

		await waitFor(() => {
			expect(screen.getByText(/Available after:/i)).toBeInTheDocument();
		});
	});
});
