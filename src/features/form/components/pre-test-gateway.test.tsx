import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PreTestGateway } from "./pre-test-gateway";
import * as useFormUnlock from "@/hooks/use-form-unlock";

vi.mock("@/hooks/use-form-unlock", () => ({
	useFormUnlock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

describe("PreTestGateway", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders children when no preTestFormId provided", () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			status: { isUnlocked: false, reason: null, earliestUnlockAt: null },
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway preTestFormId="">
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		expect(screen.getByTestId("children")).toBeInTheDocument();
	});

	it("renders children when enabled is false", () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: null,
			status: { isUnlocked: false, reason: null, earliestUnlockAt: null },
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway preTestFormId="form-123" enabled={false}>
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		expect(screen.getByTestId("children")).toBeInTheDocument();
	});

	it("renders children when form is unlocked", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: {
				isUnlocked: true,
				reason: null,
				earliestUnlockAt: null,
			},
			isLoading: false,
			error: null,
			status: { isUnlocked: true, reason: null, earliestUnlockAt: null },
			isUnlocked: true,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway preTestFormId="form-123" assignmentId="assign-1">
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("children")).toBeInTheDocument();
		});
	});

	it("renders gateway when form is locked", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: {
				isUnlocked: false,
				reason: "Complete the pre-test first",
				earliestUnlockAt: null,
			},
			isLoading: false,
			error: null,
			status: { isUnlocked: false, reason: "Complete the pre-test first", earliestUnlockAt: null },
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway preTestFormId="form-123" assignmentId="assign-1">
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Pre-Test Required")).toBeInTheDocument();
		});
	});

	it("renders custom title and description", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: {
				isUnlocked: false,
				reason: "Custom reason",
				earliestUnlockAt: null,
			},
			isLoading: false,
			error: null,
			status: { isUnlocked: false, reason: "Custom reason", earliestUnlockAt: null },
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway
				preTestFormId="form-123"
				title="Custom Title"
				description="Custom Description"
			>
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Custom Title")).toBeInTheDocument();
			expect(screen.getByText("Custom Description")).toBeInTheDocument();
		});
	});

	it("shows error state when error is present", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: undefined,
			isLoading: false,
			error: new Error("Network error"),
			status: { isUnlocked: false, reason: null, earliestUnlockAt: null },
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway preTestFormId="form-123">
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Failed to check pre-test status")).toBeInTheDocument();
		});
	});

	it("shows loading state while fetching", () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: undefined,
			isLoading: true,
			error: null,
			status: { isUnlocked: false, reason: null, earliestUnlockAt: null },
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PreTestGateway preTestFormId="form-123">
				<div data-testid="children">Child Content</div>
			</PreTestGateway>,
		);

		// Should show loading spinner
		expect(document.querySelector(".animate-spin")).toBeInTheDocument();
	});
});
