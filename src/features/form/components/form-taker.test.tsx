import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormTaker } from "./form-taker";

const mockForm = {
	id: "form-1",
	title: "Test Form",
	description: "Test description",
	type: "pre_test" as const,
	status: "published" as const,
};

const mockQuestions = [
	{
		id: "q1",
		questionText: "What is your name?",
		type: "text" as const,
		orderIndex: 0,
		required: true,
		options: { type: "text" as const, minLength: 2, maxLength: 50 },
	},
	{
		id: "q2",
		questionText: "How satisfied are you?",
		type: "likert" as const,
		orderIndex: 1,
		required: true,
		options: {
			type: "likert" as const,
			scaleSize: 5,
			labels: { "1": "Poor", "5": "Excellent" },
		},
	},
	{
		id: "q3",
		questionText: "Select an option",
		type: "mcq" as const,
		orderIndex: 2,
		required: false,
		options: [
			{ id: "opt1", text: "Option A" },
			{ id: "opt2", text: "Option B" },
		],
	},
];

describe("FormTaker", () => {
	it("renders form title and description", () => {
		render(<FormTaker form={mockForm} questions={mockQuestions} />);
		expect(screen.getByText("Test Form")).toBeInTheDocument();
		expect(screen.getByText("Test description")).toBeInTheDocument();
	});

	it("shows first question by default", () => {
		render(<FormTaker form={mockForm} questions={mockQuestions} />);
		expect(screen.getByText("What is your name?")).toBeInTheDocument();
		expect(screen.getByText("Question 1 of 3")).toBeInTheDocument();
	});

	it("displays progress bar with correct percentage", () => {
		render(<FormTaker form={mockForm} questions={mockQuestions} />);
		expect(screen.getByText("33% complete")).toBeInTheDocument();
	});

	it("navigates to next question when clicking next", async () => {
		const user = userEvent.setup();
		render(<FormTaker form={mockForm} questions={mockQuestions} />);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);

		expect(screen.getByText("How satisfied are you?")).toBeInTheDocument();
		expect(screen.getByText("Question 2 of 3")).toBeInTheDocument();
	});

	it("navigates to previous question when clicking previous", async () => {
		const user = userEvent.setup();
		render(<FormTaker form={mockForm} questions={mockQuestions} />);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);

		const prevButton = screen.getByTestId("previous-button");
		await user.click(prevButton);

		expect(screen.getByText("What is your name?")).toBeInTheDocument();
	});

	it("disables previous button on first question", () => {
		render(<FormTaker form={mockForm} questions={mockQuestions} />);
		const prevButton = screen.getByTestId("previous-button");
		expect(prevButton).toBeDisabled();
	});

	it("shows submit button on last question", async () => {
		const user = userEvent.setup();
		render(<FormTaker form={mockForm} questions={mockQuestions} />);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);
		await user.click(nextButton);

		expect(screen.queryByTestId("next-button")).not.toBeInTheDocument();
		expect(screen.getByTestId("submit-button")).toBeInTheDocument();
	});

	it("calls onAnswerChange when answer changes", () => {
		const onAnswerChange = vi.fn();
		render(
			<FormTaker
				form={mockForm}
				questions={mockQuestions}
				onAnswerChange={onAnswerChange}
			/>,
		);

		const textarea = screen.getByRole("textbox");
		fireEvent.change(textarea, { target: { value: "John" } });

		expect(onAnswerChange).toHaveBeenCalledWith("q1", "John");
	});

	it("disables submit when required question unanswered", async () => {
		const user = userEvent.setup();
		render(<FormTaker form={mockForm} questions={mockQuestions} />);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);
		await user.click(nextButton);

		expect(screen.queryByTestId("next-button")).not.toBeInTheDocument();
		expect(screen.getByTestId("submit-button")).toBeDisabled();
	});

	it("enables submit when all required questions answered", async () => {
		const user = userEvent.setup();
		const answers = { q1: "John", q2: 4 };

		render(
			<FormTaker form={mockForm} questions={mockQuestions} answers={answers} />,
		);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);
		await user.click(nextButton);

		expect(screen.queryByTestId("next-button")).not.toBeInTheDocument();
		expect(screen.getByTestId("submit-button")).toBeEnabled();
	});

	it("calls onSubmit when form is submitted", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		const answers = { q1: "John", q2: 4 };

		render(
			<FormTaker
				form={mockForm}
				questions={mockQuestions}
				answers={answers}
				onSubmit={onSubmit}
			/>,
		);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);
		await user.click(nextButton);

		const submitButton = screen.getByTestId("submit-button");
		await user.click(submitButton);

		expect(onSubmit).toHaveBeenCalledWith(answers);
	});

	it("shows submitted state after submission", async () => {
		const user = userEvent.setup();
		const answers = { q1: "John", q2: 4 };

		render(
			<FormTaker form={mockForm} questions={mockQuestions} answers={answers} />,
		);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);
		await user.click(nextButton);

		const submitButton = screen.getByTestId("submit-button");
		await user.click(submitButton);

		expect(screen.getByText("Form Submitted!")).toBeInTheDocument();
	});

	it("shows empty state when no questions", () => {
		render(<FormTaker form={mockForm} questions={[]} />);
		expect(screen.getByText("This form has no questions.")).toBeInTheDocument();
	});

	it("disables next button on last question", async () => {
		const user = userEvent.setup();
		render(<FormTaker form={mockForm} questions={mockQuestions} />);

		const nextButton = screen.getByTestId("next-button");
		await user.click(nextButton);

		expect(screen.getByTestId("next-button")).toBeEnabled();

		await user.click(nextButton);

		expect(screen.queryByTestId("next-button")).not.toBeInTheDocument();
	});

	it("shows auto-save enabled indicator initially", () => {
		render(<FormTaker form={mockForm} questions={mockQuestions} />);
		expect(screen.getByText("Auto-save enabled")).toBeInTheDocument();
	});
});
