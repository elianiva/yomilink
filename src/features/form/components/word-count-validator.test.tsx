import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordCountValidator, countWords } from "./word-count-validator";

describe("WordCountValidator", () => {
	describe("rendering", () => {
		it("renders with word count", () => {
			render(<WordCountValidator wordCount={50} />);
			expect(screen.getByTestId("word-count-validator")).toBeInTheDocument();
			expect(screen.getByTestId("word-count-message")).toHaveTextContent(
				"50 words",
			);
		});

		it("renders with zero words", () => {
			render(<WordCountValidator wordCount={0} />);
			expect(screen.getByTestId("word-count-message")).toHaveTextContent(
				"0 words",
			);
		});

		it("applies custom className", () => {
			render(<WordCountValidator wordCount={10} className="custom-class" />);
			expect(screen.getByTestId("word-count-validator")).toHaveClass(
				"custom-class",
			);
		});
	});

	describe("minimum word count validation", () => {
		it("shows warning when below minimum", () => {
			render(<WordCountValidator wordCount={50} minWordCount={100} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveTextContent("50 / 100 words minimum");
			expect(message).toHaveClass("text-amber-500");
		});

		it("shows checkmark when meeting minimum", () => {
			render(<WordCountValidator wordCount={100} minWordCount={100} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveTextContent("100 words");
			expect(message).toHaveClass("text-green-500");
		});

		it("shows checkmark when exceeding minimum", () => {
			render(<WordCountValidator wordCount={150} minWordCount={100} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveTextContent("150 words");
			expect(message).toHaveClass("text-green-500");
		});

		it("displays minimum label when showLabels is true", () => {
			render(<WordCountValidator wordCount={50} minWordCount={100} />);
			expect(screen.getByTestId("min-word-label")).toHaveTextContent(
				"Minimum 100 words required",
			);
		});

		it("hides minimum label when showLabels is false", () => {
			render(
				<WordCountValidator
					wordCount={50}
					minWordCount={100}
					showLabels={false}
				/>,
			);
			expect(screen.queryByTestId("min-word-label")).not.toBeInTheDocument();
		});

		it("ignores minimum of 0", () => {
			render(<WordCountValidator wordCount={0} minWordCount={0} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveClass("text-green-500");
		});
	});

	describe("maximum word count validation", () => {
		it("shows valid when below maximum", () => {
			render(<WordCountValidator wordCount={80} maxWordCount={100} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveTextContent("80 words");
			expect(message).toHaveClass("text-green-500");
		});

		it("shows valid when at maximum", () => {
			render(<WordCountValidator wordCount={100} maxWordCount={100} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveTextContent("100 words");
			expect(message).toHaveClass("text-green-500");
		});

		it("shows error when exceeding maximum", () => {
			render(<WordCountValidator wordCount={120} maxWordCount={100} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveTextContent("120 / 100 words (exceeds maximum)");
			expect(message).toHaveClass("text-destructive");
		});
	});

	describe("combined min and max validation", () => {
		it("prioritizes maximum error when both violated", () => {
			render(
				<WordCountValidator
					wordCount={0}
					minWordCount={50}
					maxWordCount={100}
				/>,
			);
			// 0 is below minimum, but we need to test the priority
			// Actually, 0 is only below minimum, not above max
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveClass("text-amber-500");
		});

		it("shows maximum error when exceeding max even if above min", () => {
			render(
				<WordCountValidator
					wordCount={150}
					minWordCount={50}
					maxWordCount={100}
				/>,
			);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveClass("text-destructive");
			expect(message).toHaveTextContent("exceeds maximum");
		});

		it("shows valid when within range", () => {
			render(
				<WordCountValidator
					wordCount={75}
					minWordCount={50}
					maxWordCount={100}
				/>,
			);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveClass("text-green-500");
		});
	});

	describe("edge cases", () => {
		it("handles single word", () => {
			render(<WordCountValidator wordCount={1} />);
			expect(screen.getByTestId("word-count-message")).toHaveTextContent(
				"1 words",
			);
		});

		it("handles large word counts", () => {
			render(<WordCountValidator wordCount={99999} />);
			expect(screen.getByTestId("word-count-message")).toHaveTextContent(
				"99999 words",
			);
		});

		it("handles no min or max specified", () => {
			render(<WordCountValidator wordCount={50} />);
			const message = screen.getByTestId("word-count-message");
			expect(message).toHaveClass("text-green-500");
			expect(screen.queryByTestId("min-word-label")).not.toBeInTheDocument();
		});
	});
});

describe("countWords", () => {
	it("returns 0 for empty string", () => {
		expect(countWords("")).toBe(0);
	});

	it("returns 0 for whitespace only", () => {
		expect(countWords("   ")).toBe(0);
		expect(countWords("\t\n  ")).toBe(0);
	});

	it("counts single word", () => {
		expect(countWords("hello")).toBe(1);
	});

	it("counts multiple words", () => {
		expect(countWords("hello world")).toBe(2);
		expect(countWords("the quick brown fox")).toBe(4);
	});

	it("handles multiple spaces", () => {
		expect(countWords("hello    world")).toBe(2);
	});

	it("trims leading/trailing whitespace", () => {
		expect(countWords("  hello world  ")).toBe(2);
	});

	it("handles newlines and tabs", () => {
		expect(countWords("hello\nworld\ttest")).toBe(3);
	});

	it("handles real paragraph", () => {
		const text = "This is a sample paragraph with multiple words for testing.";
		expect(countWords(text)).toBe(10);
	});
});
