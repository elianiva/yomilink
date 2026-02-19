import { beforeEach, describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { ManualUnlockButton } from "./manual-unlock-button";
import * as ReactQuery from "@tanstack/react-query";

vi.mock("@tanstack/react-query", () => ({
	...vi.importActual("@tanstack/react-query"),
	useMutation: vi.fn(),
}));

vi.mock("@/server/rpc/form", () => ({
	FormRpc: {
		unlockForm: vi.fn(() => ({
			mutationKey: ["forms", "unlock"],
			mutationFn: vi.fn(),
		})),
	},
}));

const mockUseMutation = vi.mocked(ReactQuery.useMutation);

describe("ManualUnlockButton", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders unlock button", () => {
		mockUseMutation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		render(<ManualUnlockButton formId="form-1" userId="user-1" />);

		expect(screen.getByRole("button", { name: /unlock/i })).toBeInTheDocument();
	});

	it("opens confirmation dialog when clicked", async () => {
		mockUseMutation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		const user = userEvent.setup();
		render(
			<ManualUnlockButton
				formId="form-1"
				userId="user-1"
				userName="John Doe"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /unlock/i }));

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(
			screen.getByText(/are you sure you want to manually unlock/i),
		).toBeInTheDocument();
		expect(screen.getByText("John Doe")).toBeInTheDocument();
	});

	it("shows user name in dialog when provided", async () => {
		mockUseMutation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		const user = userEvent.setup();
		render(
			<ManualUnlockButton
				formId="form-1"
				userId="user-1"
				userName="Jane Smith"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /unlock/i }));

		expect(screen.getByText("Jane Smith")).toBeInTheDocument();
	});

	it("shows default 'this user' when userName not provided", async () => {
		mockUseMutation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		const user = userEvent.setup();
		render(<ManualUnlockButton formId="form-1" userId="user-1" />);

		await user.click(screen.getByRole("button", { name: /unlock/i }));

		expect(screen.getByText("this user")).toBeInTheDocument();
	});

	it("closes dialog on cancel", async () => {
		mockUseMutation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		const user = userEvent.setup();
		render(<ManualUnlockButton formId="form-1" userId="user-1" />);

		await user.click(screen.getByRole("button", { name: /unlock/i }));
		expect(screen.getByRole("dialog")).toBeInTheDocument();

		await user.click(screen.getByRole("button", { name: /^cancel$/i }));
		await waitFor(() => {
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		});
	});

	it("calls mutate when unlock button is clicked", async () => {
		const mutateFn = vi.fn().mockResolvedValue({});

		mockUseMutation.mockImplementation(
			(_options: unknown) =>
				({
					mutate: mutateFn,
					mutateAsync: mutateFn,
					isPending: false,
					isError: false,
					isSuccess: false,
					data: undefined,
					error: null,
					reset: vi.fn(),
				}) as never,
		);

		const user = userEvent.setup();
		render(<ManualUnlockButton formId="form-1" userId="user-1" />);

		await user.click(screen.getByRole("button", { name: /unlock/i }));
		await user.click(screen.getByRole("button", { name: /^unlock form$/i }));

		expect(mutateFn).toHaveBeenCalled();
	});

	it("shows loading state while unlocking", async () => {
		const mutateFn = vi.fn();

		mockUseMutation.mockReturnValue({
			mutate: mutateFn,
			mutateAsync: mutateFn,
			isPending: true,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		const user = userEvent.setup();
		render(<ManualUnlockButton formId="form-1" userId="user-1" />);

		await user.click(screen.getByRole("button", { name: /unlock/i }));
		await user.click(screen.getByRole("button", { name: /^unlock form$/i }));

		expect(screen.getByRole("button", { name: /unlock form/i })).toBeDisabled();
	});

	it("applies custom className to button", () => {
		mockUseMutation.mockReturnValue({
			mutate: vi.fn(),
			mutateAsync: vi.fn(),
			isPending: false,
			isError: false,
			isSuccess: false,
			data: undefined,
			error: null,
			reset: vi.fn(),
		} as never);

		render(
			<ManualUnlockButton
				formId="form-1"
				userId="user-1"
				className="custom-class"
			/>,
		);

		expect(screen.getByRole("button", { name: /unlock/i })).toHaveClass(
			"custom-class",
		);
	});
});
