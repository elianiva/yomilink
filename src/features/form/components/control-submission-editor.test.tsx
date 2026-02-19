import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
	ControlSubmissionEditor,
	createDefaultControlSubmissionData,
} from "./control-submission-editor";

describe("ControlSubmissionEditor", () => {
	it("renders with default props", () => {
		render(<ControlSubmissionEditor />);

		expect(screen.getByTestId("control-submission-editor")).toBeInTheDocument();
		expect(screen.getByTestId("editor-content")).toBeInTheDocument();
		expect(screen.getByTestId("bold-button")).toBeInTheDocument();
		expect(screen.getByTestId("italic-button")).toBeInTheDocument();
		expect(screen.getByTestId("bullet-list-button")).toBeInTheDocument();
		expect(screen.getByTestId("numbered-list-button")).toBeInTheDocument();
	});

	it("renders with initial content", () => {
		render(<ControlSubmissionEditor initialContent="Initial text here" />);

		const editor = screen.getByTestId("editor-content");
		expect(editor).toHaveTextContent("Initial text here");
	});

	it("displays word count correctly", () => {
		render(
			<ControlSubmissionEditor initialContent="This is a test sentence" minWordCount={0} />,
		);

		expect(screen.getByTestId("word-count")).toHaveTextContent("5 words");
	});

	it("shows warning when below minimum word count", () => {
		render(
			<ControlSubmissionEditor
				initialContent="Short text"
				minWordCount={10}
			/>,
		);

		const wordCount = screen.getByTestId("word-count");
		expect(wordCount).toHaveTextContent("2 / 10 words minimum");
		expect(wordCount).toHaveClass("text-amber-500");
	});

	it("shows success when meeting minimum word count", () => {
		render(
			<ControlSubmissionEditor
				initialContent="This is a longer text that meets the minimum word count requirement"
				minWordCount={10}
			/>,
		);

		const wordCount = screen.getByTestId("word-count");
		expect(wordCount).toHaveTextContent("12 words");
		expect(wordCount).toHaveClass("text-green-500");
	});

	it("calls onChange when content changes", () => {
		const handleChange = vi.fn();
		render(<ControlSubmissionEditor onChange={handleChange} />);

		const editor = screen.getByTestId("editor-content");
		fireEvent.input(editor, { target: { innerText: "New content" } });

		expect(handleChange).toHaveBeenCalledWith({
			content: "New content",
			wordCount: 2,
		});
	});

	it("disables buttons when disabled prop is true", () => {
		render(<ControlSubmissionEditor disabled />);

		expect(screen.getByTestId("bold-button")).toBeDisabled();
		expect(screen.getByTestId("italic-button")).toBeDisabled();
		expect(screen.getByTestId("bullet-list-button")).toBeDisabled();
		expect(screen.getByTestId("numbered-list-button")).toBeDisabled();
	});

	it("displays minimum word count requirement", () => {
		render(<ControlSubmissionEditor minWordCount={200} />);

		expect(
			screen.getByText("Minimum 200 words required"),
		).toBeInTheDocument();
	});

	it("applies custom className", () => {
		render(<ControlSubmissionEditor className="custom-class" />);

		expect(screen.getByTestId("control-submission-editor")).toHaveClass(
			"custom-class",
		);
	});

	it("counts zero words for empty content", () => {
		render(<ControlSubmissionEditor initialContent="" />);

		expect(screen.getByTestId("word-count")).toHaveTextContent("0 words");
	});

	it("counts zero words for whitespace only", () => {
		render(<ControlSubmissionEditor initialContent="   " />);

		expect(screen.getByTestId("word-count")).toHaveTextContent("0 words");
	});

	it("handles maximum word count validation", () => {
		render(
			<ControlSubmissionEditor
				initialContent="one two three four five"
				maxWordCount={3}
			/>,
		);

		const wordCount = screen.getByTestId("word-count");
		expect(wordCount).toHaveTextContent("5 / 3 words (exceeds maximum)");
		expect(wordCount).toHaveClass("text-destructive");
	});
});

describe("createDefaultControlSubmissionData", () => {
	it("returns default data structure", () => {
		const data = createDefaultControlSubmissionData();

		expect(data).toEqual({
			content: "",
			wordCount: 0,
		});
	});
});
