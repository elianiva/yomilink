import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { ControlSubmissionConfirmModal } from "./control-submission-confirm-modal";

describe("ControlSubmissionConfirmModal", () => {
	const defaultProps = {
		isOpen: true,
		onClose: vi.fn(),
		onConfirm: vi.fn(),
		content: "This is my submission content for the control group assignment.",
		wordCount: 10,
		minWordCount: 100,
		isSubmitting: false,
	};

	it("renders when isOpen is true", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} />);

		expect(screen.getByTestId("control-submission-confirm-modal")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Confirm Submission" })).toBeInTheDocument();
	});

	it("does not render when isOpen is false", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} isOpen={false} />);

		expect(screen.queryByTestId("control-submission-confirm-modal")).not.toBeInTheDocument();
	});

	it("displays content preview", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} />);

		expect(screen.getByTestId("content-preview")).toHaveTextContent(defaultProps.content);
	});

	it("displays word count", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} />);

		expect(screen.getByTestId("preview-word-count")).toHaveTextContent("10 words");
	});

	it("shows warning when word count is below minimum", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} />);

		expect(screen.getByTestId("word-count-warning")).toBeInTheDocument();
		expect(screen.getByText("Word count below minimum")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Your submission has 10 words, but the minimum required is 100 words.",
			),
		).toBeInTheDocument();
	});

	it("does not show warning when word count meets minimum", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} wordCount={150} />);

		expect(screen.queryByTestId("word-count-warning")).not.toBeInTheDocument();
	});

	it("disables confirm button when below minimum word count", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} />);

		expect(screen.getByTestId("confirm-button")).toBeDisabled();
	});

	it("enables confirm button when word count meets minimum", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} wordCount={150} />);

		expect(screen.getByTestId("confirm-button")).not.toBeDisabled();
	});

	it("calls onConfirm when confirm button clicked", () => {
		const handleConfirm = vi.fn();
		render(
			<ControlSubmissionConfirmModal
				{...defaultProps}
				onConfirm={handleConfirm}
				wordCount={150}
			/>,
		);

		fireEvent.click(screen.getByTestId("confirm-button"));
		expect(handleConfirm).toHaveBeenCalledTimes(1);
	});

	it("calls onClose when cancel button clicked", () => {
		const handleClose = vi.fn();
		render(<ControlSubmissionConfirmModal {...defaultProps} onClose={handleClose} />);

		fireEvent.click(screen.getByTestId("cancel-button"));
		expect(handleClose).toHaveBeenCalledTimes(1);
	});

	it("shows submitting state", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} isSubmitting />);

		expect(screen.getByTestId("confirm-button")).toHaveTextContent("Submitting...");
		expect(screen.getByTestId("confirm-button")).toBeDisabled();
		expect(screen.getByTestId("cancel-button")).toBeDisabled();
	});

	it("displays preview for empty content", () => {
		render(<ControlSubmissionConfirmModal {...defaultProps} content="" />);

		expect(screen.getByTestId("content-preview")).toHaveTextContent("No content provided");
	});

	it("truncates long content in preview", () => {
		const longContent = "a".repeat(1500);
		render(<ControlSubmissionConfirmModal {...defaultProps} content={longContent} />);

		const preview = screen.getByTestId("content-preview");
		expect(preview.textContent).toHaveLength(1003); // 1000 + "..."
		expect(preview.textContent?.endsWith("...")).toBe(true);
	});
});
