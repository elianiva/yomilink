import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { FormattingToolbar } from "./formatting-toolbar";

describe("FormattingToolbar", () => {
	const mockExecCommand = vi.fn();

	beforeEach(() => {
		// Mock document.execCommand
		Object.defineProperty(document, "execCommand", {
			value: mockExecCommand,
			writable: true,
		});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("renders formatting toolbar with all buttons", () => {
		render(<FormattingToolbar />);

		expect(screen.getByTestId("formatting-toolbar")).toBeInTheDocument();
		expect(screen.getByTestId("bold-button")).toBeInTheDocument();
		expect(screen.getByTestId("italic-button")).toBeInTheDocument();
		expect(screen.getByTestId("bullet-list-button")).toBeInTheDocument();
		expect(screen.getByTestId("numbered-list-button")).toBeInTheDocument();
	});

	it("has correct aria labels", () => {
		render(<FormattingToolbar />);

		expect(screen.getByLabelText("Bold")).toBeInTheDocument();
		expect(screen.getByLabelText("Italic")).toBeInTheDocument();
		expect(screen.getByLabelText("Bullet list")).toBeInTheDocument();
		expect(screen.getByLabelText("Numbered list")).toBeInTheDocument();
		expect(screen.getByRole("toolbar")).toHaveAttribute("aria-label", "Text formatting");
	});

	it("applies bold formatting when bold button is clicked", async () => {
		render(<FormattingToolbar />);

		await userEvent.click(screen.getByTestId("bold-button"));

		expect(mockExecCommand).toHaveBeenCalledWith("bold", false);
	});

	it("applies italic formatting when italic button is clicked", async () => {
		render(<FormattingToolbar />);

		await userEvent.click(screen.getByTestId("italic-button"));

		expect(mockExecCommand).toHaveBeenCalledWith("italic", false);
	});

	it("applies bullet list formatting when bullet list button is clicked", async () => {
		render(<FormattingToolbar />);

		await userEvent.click(screen.getByTestId("bullet-list-button"));

		expect(mockExecCommand).toHaveBeenCalledWith("insertUnorderedList", false);
	});

	it("applies numbered list formatting when numbered list button is clicked", async () => {
		render(<FormattingToolbar />);

		await userEvent.click(screen.getByTestId("numbered-list-button"));

		expect(mockExecCommand).toHaveBeenCalledWith("insertOrderedList", false);
	});

	it("calls onBold callback when bold button is clicked", async () => {
		const onBold = vi.fn();
		render(<FormattingToolbar onBold={onBold} />);

		await userEvent.click(screen.getByTestId("bold-button"));

		expect(onBold).toHaveBeenCalled();
	});

	it("calls onItalic callback when italic button is clicked", async () => {
		const onItalic = vi.fn();
		render(<FormattingToolbar onItalic={onItalic} />);

		await userEvent.click(screen.getByTestId("italic-button"));

		expect(onItalic).toHaveBeenCalled();
	});

	it("calls onBulletList callback when bullet list button is clicked", async () => {
		const onBulletList = vi.fn();
		render(<FormattingToolbar onBulletList={onBulletList} />);

		await userEvent.click(screen.getByTestId("bullet-list-button"));

		expect(onBulletList).toHaveBeenCalled();
	});

	it("calls onNumberedList callback when numbered list button is clicked", async () => {
		const onNumberedList = vi.fn();
		render(<FormattingToolbar onNumberedList={onNumberedList} />);

		await userEvent.click(screen.getByTestId("numbered-list-button"));

		expect(onNumberedList).toHaveBeenCalled();
	});

	it("disables all buttons when disabled prop is true", () => {
		render(<FormattingToolbar disabled />);

		expect(screen.getByTestId("bold-button")).toBeDisabled();
		expect(screen.getByTestId("italic-button")).toBeDisabled();
		expect(screen.getByTestId("bullet-list-button")).toBeDisabled();
		expect(screen.getByTestId("numbered-list-button")).toBeDisabled();
	});

	it("enables all buttons when disabled prop is false", () => {
		render(<FormattingToolbar disabled={false} />);

		expect(screen.getByTestId("bold-button")).toBeEnabled();
		expect(screen.getByTestId("italic-button")).toBeEnabled();
		expect(screen.getByTestId("bullet-list-button")).toBeEnabled();
		expect(screen.getByTestId("numbered-list-button")).toBeEnabled();
	});

	it("does not call execCommand when disabled", async () => {
		render(<FormattingToolbar disabled />);

		await userEvent.click(screen.getByTestId("bold-button"));

		expect(mockExecCommand).not.toHaveBeenCalled();
	});

	it("applies custom className", () => {
		render(<FormattingToolbar className="custom-class" />);

		expect(screen.getByTestId("formatting-toolbar")).toHaveClass("custom-class");
	});

	it("renders separator between text and list buttons", () => {
		render(<FormattingToolbar />);

		const separator = screen
			.getByTestId("formatting-toolbar")
			.querySelector("[data-orientation]");
		expect(separator).toBeInTheDocument();
		expect(separator).toHaveAttribute("data-orientation", "vertical");
	});

	it("buttons have title attributes for tooltip", () => {
		render(<FormattingToolbar />);

		expect(screen.getByTestId("bold-button")).toHaveAttribute("title", "Bold");
		expect(screen.getByTestId("italic-button")).toHaveAttribute("title", "Italic");
		expect(screen.getByTestId("bullet-list-button")).toHaveAttribute("title", "Bullet list");
		expect(screen.getByTestId("numbered-list-button")).toHaveAttribute(
			"title",
			"Numbered list",
		);
	});
});
