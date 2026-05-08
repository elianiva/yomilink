import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vite-plus/test";

import type { StudentQuestionOutput } from "@/features/form/lib/form-service.shared";

import { FormNoQuestions, FormSubmittedSuccess } from "./form-taker";
import { FormHeaderBar } from "./form-taker/form-header-bar";
import { FormProgressBar } from "./form-taker/form-progress-bar";
import { QuestionList } from "./form-taker/question-list";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, ...props }: { children: ReactNode; to: string; className?: string }) => (
		<a href={props.to} className={props.className}>
			{children}
		</a>
	),
}));

const mockQuestions: StudentQuestionOutput[] = [
	{
		id: "q1",
		formId: "form-1",
		questionText: "What is your name?",
		type: "text",
		orderIndex: 0,
		required: true,
		options: { type: "text", minLength: 2, maxLength: 50 },
		createdAt: 0,
		updatedAt: 0,
	},
	{
		id: "q2",
		formId: "form-1",
		questionText: "How satisfied are you?",
		type: "likert",
		orderIndex: 1,
		required: true,
		options: { type: "likert", scaleSize: 5, labels: { "1": "Poor", "5": "Excellent" } },
		createdAt: 0,
		updatedAt: 0,
	},
	{
		id: "q3",
		formId: "form-1",
		questionText: "Select an option",
		type: "mcq",
		orderIndex: 2,
		required: false,
		options: {
			type: "mcq",
			options: [
				{ id: "opt1", text: "Option A" },
				{ id: "opt2", text: "Option B" },
			],
			shuffle: false,
		},
		createdAt: 0,
		updatedAt: 0,
	},
];

describe("QuestionList", () => {
	it("renders all questions", () => {
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{}}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={false}
				isPending={false}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByText("What is your name?")).toBeInTheDocument();
		expect(screen.getByText("How satisfied are you?")).toBeInTheDocument();
		expect(screen.getByText("Select an option")).toBeInTheDocument();
	});

	it("shows remaining count when required unanswered", () => {
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{}}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={false}
				isPending={false}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByText(/2 remaining/)).toBeInTheDocument();
	});

	it("shows all answered when required questions are answered", () => {
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{ q1: "John", q2: 4 }}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={true}
				isPending={false}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByText("All required questions answered")).toBeInTheDocument();
	});

	it("disables submit when not all required answered", () => {
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{}}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={false}
				isPending={false}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
	});

	it("enables submit when all required answered", () => {
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{ q1: "John", q2: 4 }}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={true}
				isPending={false}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /submit/i })).toBeEnabled();
	});

	it("calls onSubmit when submit clicked", () => {
		const onSubmit = vi.fn();
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{ q1: "John", q2: 4 }}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={true}
				isPending={false}
				onSubmit={onSubmit}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /submit/i }));
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	it("shows submitting state when pending", () => {
		render(
			<QuestionList
				questions={mockQuestions}
				answers={{ q1: "John", q2: 4 }}
				onAnswerChange={vi.fn()}
				requiredQuestions={mockQuestions.filter((q) => q.required)}
				answeredRequired={true}
				isPending={true}
				onSubmit={vi.fn()}
			/>,
		);

		expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
	});
});

describe("FormHeaderBar", () => {
	it("shows title and description", () => {
		render(
			<FormHeaderBar
				title="Test Form"
				description="Test description"
				answeredCount={0}
				totalQuestions={3}
				lastSaved={null}
				onBack={vi.fn()}
			/>,
		);

		expect(screen.getByText("Test Form")).toBeInTheDocument();
		expect(screen.getByText("Test description")).toBeInTheDocument();
		expect(screen.getByText("0 of 3 answered")).toBeInTheDocument();
	});
});

describe("FormProgressBar", () => {
	it("renders with correct width", () => {
		const { container } = render(<FormProgressBar progress={50} />);
		const inner = container.querySelector(".bg-primary");
		expect(inner).toHaveStyle({ width: "50%" });
	});
});

describe("FormNoQuestions", () => {
	it("shows empty state message", () => {
		render(<FormNoQuestions title="Empty Form" />);
		expect(screen.getByText("This form has no questions.")).toBeInTheDocument();
	});
});

describe("FormSubmittedSuccess", () => {
	it("shows success message", () => {
		render(<FormSubmittedSuccess />);
		expect(screen.getByText("Form Submitted!")).toBeInTheDocument();
	});
});
