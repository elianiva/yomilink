import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormProgressBar } from "./form-progress-bar";

describe("FormProgressBar", () => {
	it("renders with correct question count", () => {
		render(<FormProgressBar currentQuestion={1} totalQuestions={10} />);

		expect(screen.getByText("Question 1 of 10")).toBeInTheDocument();
	});

	it("displays 10% for first question (1-indexed)", () => {
		render(<FormProgressBar currentQuestion={1} totalQuestions={10} />);

		expect(screen.getByText("10% complete")).toBeInTheDocument();
	});

	it("displays 50% for middle question", () => {
		render(<FormProgressBar currentQuestion={5} totalQuestions={10} />);

		expect(screen.getByText("50% complete")).toBeInTheDocument();
	});

	it("displays 100% for last question", () => {
		render(<FormProgressBar currentQuestion={10} totalQuestions={10} />);

		expect(screen.getByText("100% complete")).toBeInTheDocument();
	});

	it("allows percentage over 100% when current exceeds total", () => {
		render(<FormProgressBar currentQuestion={15} totalQuestions={10} />);

		expect(screen.getByText("150% complete")).toBeInTheDocument();
	});

	it("handles zero total questions", () => {
		render(<FormProgressBar currentQuestion={0} totalQuestions={0} />);

		expect(screen.getByText("Question 0 of 0")).toBeInTheDocument();
		expect(screen.getByText("0% complete")).toBeInTheDocument();
	});

	it("handles single question", () => {
		render(<FormProgressBar currentQuestion={1} totalQuestions={1} />);

		expect(screen.getByText("Question 1 of 1")).toBeInTheDocument();
		expect(screen.getByText("100% complete")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<FormProgressBar
				currentQuestion={1}
				totalQuestions={10}
				className="custom-class"
			/>,
		);

		expect(container.firstChild).toHaveClass("custom-class");
	});

	it("calculates percentage correctly for various values", () => {
		const { rerender } = render(
			<FormProgressBar currentQuestion={2} totalQuestions={4} />,
		);
		expect(screen.getByText("50% complete")).toBeInTheDocument();

		rerender(<FormProgressBar currentQuestion={3} totalQuestions={4} />);
		expect(screen.getByText("75% complete")).toBeInTheDocument();

		rerender(<FormProgressBar currentQuestion={1} totalQuestions={3} />);
		expect(screen.getByText("33% complete")).toBeInTheDocument();
	});

	it("renders progress bar with correct width", () => {
		render(<FormProgressBar currentQuestion={5} totalQuestions={10} />);

		const progressFill = document.querySelector(".bg-primary") as HTMLElement;
		expect(progressFill).toHaveStyle({ width: "50%" });
	});
});
