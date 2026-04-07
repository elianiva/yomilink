import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import * as useFormUnlock from "@/hooks/use-form-unlock";

import { PrerequisiteGateway } from "./prerequisite-gateway";

vi.mock("@/hooks/use-form-unlock", () => ({
	useFormUnlock: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

describe("PrerequisiteGateway", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders children when no requiredFormId provided", () => {
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
			<PrerequisiteGateway requiredFormId="">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
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
			<PrerequisiteGateway requiredFormId="form-123" enabled={false}>
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
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
			<PrerequisiteGateway requiredFormId="form-123">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		await waitFor(() => {
			expect(screen.getByTestId("children")).toBeInTheDocument();
		});
	});

	it("renders pre-test gateway when form is locked", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: {
				isUnlocked: false,
				reason: "Complete the pre-test first",
				earliestUnlockAt: null,
			},
			isLoading: false,
			error: null,
			status: {
				isUnlocked: false,
				reason: "Complete the pre-test first",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PrerequisiteGateway requiredFormId="form-123" type="pre-test">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Pre-Test Required")).toBeInTheDocument();
		});
	});

	it("renders post-test gateway with default config", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: {
				isUnlocked: false,
				reason: "Complete assignment tasks first",
				earliestUnlockAt: null,
			},
			isLoading: false,
			error: null,
			status: {
				isUnlocked: false,
				reason: "Complete assignment tasks first",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PrerequisiteGateway requiredFormId="form-123" type="post-test">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Assignment Task Required")).toBeInTheDocument();
			expect(
				screen.getByText(
					"You must complete the assignment tasks before taking the post-test.",
				),
			).toBeInTheDocument();
		});
	});

	it("renders delayed-test gateway with default config", async () => {
		const mockUseFormUnlock = vi.mocked(useFormUnlock.useFormUnlock);
		mockUseFormUnlock.mockReturnValue({
			data: {
				isUnlocked: false,
				reason: "Waiting period required",
				earliestUnlockAt: null,
			},
			isLoading: false,
			error: null,
			status: {
				isUnlocked: false,
				reason: "Waiting period required",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PrerequisiteGateway requiredFormId="form-123" type="delayed-test">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Waiting Period Required")).toBeInTheDocument();
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
			status: {
				isUnlocked: false,
				reason: "Custom reason",
				earliestUnlockAt: null,
			},
			isUnlocked: false,
			refetch: vi.fn(),
		} as any);

		render(
			<PrerequisiteGateway
				requiredFormId="form-123"
				title="Custom Title"
				description="Custom Description"
			>
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Custom Title")).toBeInTheDocument();
			expect(screen.getByText("Custom Description")).toBeInTheDocument();
		});
	});

	it("shows gateway when error is present", async () => {
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
			<PrerequisiteGateway requiredFormId="form-123" type="pre-test">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		await waitFor(() => {
			expect(screen.getByText("Pre-Test Required")).toBeInTheDocument();
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
			<PrerequisiteGateway requiredFormId="form-123">
				<div data-testid="children">Child Content</div>
			</PrerequisiteGateway>,
		);

		expect(screen.queryByTestId("children")).not.toBeInTheDocument();
	});
});
