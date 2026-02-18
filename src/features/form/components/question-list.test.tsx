import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { type Question, QuestionList } from "./question-list";

const mockQuestions: Question[] = [
	{
		id: "q1",
		questionText: "What is the capital of France?",
		type: "mcq",
		orderIndex: 0,
		required: true,
	},
	{
		id: "q2",
		questionText: "Rate your experience from 1-5",
		type: "likert",
		orderIndex: 1,
		required: true,
	},
	{
		id: "q3",
		questionText: "Please describe your thoughts",
		type: "text",
		orderIndex: 2,
		required: false,
	},
];

describe("QuestionList", () => {
	describe("rendering", () => {
		it("renders empty state when no questions provided", () => {
			render(<QuestionList questions={[]} />);

			expect(screen.getByTestId("question-list-empty")).toBeInTheDocument();
			expect(
				screen.getByText(
					"No questions yet. Add your first question to get started.",
				),
			).toBeInTheDocument();
		});

		it("does not render empty state when questions exist", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(
				screen.queryByTestId("question-list-empty"),
			).not.toBeInTheDocument();
		});

		it("renders list container with aria-label", () => {
			render(<QuestionList questions={mockQuestions} />);

			const list = screen.getByLabelText("Form questions");
			expect(list).toBeInTheDocument();
		});
	});

	describe("question display", () => {
		it("renders correct number of questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(screen.getByTestId("question-list").children).toHaveLength(3);
		});

		it("displays questions in order with sequential numbers", () => {
			render(<QuestionList questions={mockQuestions} />);

			const items = screen.getAllByRole("listitem");
			expect(items).toHaveLength(3);

			expect(items[0]).toHaveAttribute(
				"aria-label",
				"Question 1: What is the capital of France?",
			);
			expect(items[1]).toHaveAttribute(
				"aria-label",
				"Question 2: Rate your experience from 1-5",
			);
			expect(items[2]).toHaveAttribute(
				"aria-label",
				"Question 3: Please describe your thoughts",
			);
		});

		it("displays question text correctly", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(
				screen.getByText("What is the capital of France?"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Rate your experience from 1-5"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Please describe your thoughts"),
			).toBeInTheDocument();
		});

		it("shows required indicator for required questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			const q1Item = screen.getByTestId("question-item-q1");
			expect(q1Item).toHaveTextContent("*");
		});

		it("does not show required indicator for optional questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			const q3Item = screen.getByTestId("question-item-q3");
			const q3Text = q3Item.textContent?.replace(/\s+/g, " ").trim();
			expect(q3Text).not.toContain("What is the capital");
			expect(q3Text).toContain("Optional");
		});
	});

	describe("type badges", () => {
		it("displays correct type labels for each question type", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(screen.getByText("Multiple Choice")).toBeInTheDocument();
			expect(screen.getByText("Likert Scale")).toBeInTheDocument();
			expect(screen.getByText("Text")).toBeInTheDocument();
		});

		it("applies correct badge styling for MCQ questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			const mcqBadge = screen.getByTestId("question-type-badge-q1");
			expect(mcqBadge.className).toContain("bg-blue-100");
		});

		it("applies correct badge styling for Likert questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			const likertBadge = screen.getByTestId("question-type-badge-q2");
			expect(likertBadge.className).toContain("bg-purple-100");
		});

		it("applies correct badge styling for Text questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			const textBadge = screen.getByTestId("question-type-badge-q3");
			expect(textBadge.className).toContain("bg-green-100");
		});

		it("shows optional badge for non-required questions", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(screen.getByText("Optional")).toBeInTheDocument();
		});
	});

	describe("actions", () => {
		it("does not show edit/delete buttons when callbacks not provided", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(screen.queryByTestId(/question-edit-btn/)).not.toBeInTheDocument();
			expect(
				screen.queryByTestId(/question-delete-btn/),
			).not.toBeInTheDocument();
		});

		it("shows edit button when onEdit callback provided", () => {
			render(<QuestionList questions={mockQuestions} onEdit={() => {}} />);

			expect(screen.getByTestId("question-edit-btn-q1")).toBeInTheDocument();
			expect(screen.getByTestId("question-edit-btn-q2")).toBeInTheDocument();
			expect(screen.getByTestId("question-edit-btn-q3")).toBeInTheDocument();
		});

		it("shows delete button when onDelete callback provided", () => {
			render(<QuestionList questions={mockQuestions} onDelete={() => {}} />);

			expect(screen.getByTestId("question-delete-btn-q1")).toBeInTheDocument();
			expect(screen.getByTestId("question-delete-btn-q2")).toBeInTheDocument();
			expect(screen.getByTestId("question-delete-btn-q3")).toBeInTheDocument();
		});

		it("calls onEdit with question data when edit button clicked", async () => {
			const onEdit = vi.fn();
			const user = userEvent.setup();

			render(<QuestionList questions={mockQuestions} onEdit={onEdit} />);

			await user.click(screen.getByTestId("question-edit-btn-q1"));

			expect(onEdit).toHaveBeenCalledTimes(1);
			expect(onEdit).toHaveBeenCalledWith(mockQuestions[0]);
		});

		it("calls onDelete with questionId when delete button clicked", async () => {
			const onDelete = vi.fn();
			const user = userEvent.setup();

			render(<QuestionList questions={mockQuestions} onDelete={onDelete} />);

			await user.click(screen.getByTestId("question-delete-btn-q2"));

			expect(onDelete).toHaveBeenCalledTimes(1);
			expect(onDelete).toHaveBeenCalledWith("q2");
		});

		it("does not show drag handle when onReorder not provided", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(
				screen.queryByTestId(/question-drag-handle/),
			).not.toBeInTheDocument();
		});

		it("shows drag handles when onReorder callback provided", () => {
			render(<QuestionList questions={mockQuestions} onReorder={() => {}} />);

			expect(screen.getByTestId("question-drag-handle-q1")).toBeInTheDocument();
			expect(screen.getByTestId("question-drag-handle-q2")).toBeInTheDocument();
			expect(screen.getByTestId("question-drag-handle-q3")).toBeInTheDocument();
		});
	});

	describe("sorting", () => {
		it("sorts questions by orderIndex", () => {
			const unsortedQuestions: Question[] = [
				{
					id: "q3",
					questionText: "Third",
					type: "text",
					orderIndex: 2,
					required: true,
				},
				{
					id: "q1",
					questionText: "First",
					type: "mcq",
					orderIndex: 0,
					required: true,
				},
				{
					id: "q2",
					questionText: "Second",
					type: "likert",
					orderIndex: 1,
					required: false,
				},
			];

			render(<QuestionList questions={unsortedQuestions} />);

			const items = screen.getAllByRole("listitem");
			expect(items[0]).toHaveAttribute("aria-label", "Question 1: First");
			expect(items[1]).toHaveAttribute("aria-label", "Question 2: Second");
			expect(items[2]).toHaveAttribute("aria-label", "Question 3: Third");
		});
	});

	describe("accessibility", () => {
		it("provides accessible labels for edit buttons", () => {
			render(<QuestionList questions={mockQuestions} onEdit={() => {}} />);

			expect(screen.getByLabelText("Edit question 1")).toBeInTheDocument();
			expect(screen.getByLabelText("Edit question 2")).toBeInTheDocument();
			expect(screen.getByLabelText("Edit question 3")).toBeInTheDocument();
		});

		it("provides accessible labels for delete buttons", () => {
			render(<QuestionList questions={mockQuestions} onDelete={() => {}} />);

			expect(screen.getByLabelText("Delete question 1")).toBeInTheDocument();
			expect(screen.getByLabelText("Delete question 2")).toBeInTheDocument();
			expect(screen.getByLabelText("Delete question 3")).toBeInTheDocument();
		});

		it("provides accessible labels for drag handles", () => {
			render(<QuestionList questions={mockQuestions} onReorder={() => {}} />);

			expect(
				screen.getByLabelText("Drag to reorder question 1"),
			).toBeInTheDocument();
			expect(
				screen.getByLabelText("Drag to reorder question 2"),
			).toBeInTheDocument();
			expect(
				screen.getByLabelText("Drag to reorder question 3"),
			).toBeInTheDocument();
		});

		it("uses semantic list structure", () => {
			render(<QuestionList questions={mockQuestions} />);

			expect(screen.getByRole("list")).toBeInTheDocument();
			expect(screen.getAllByRole("listitem")).toHaveLength(3);
		});
	});

	describe("styling", () => {
		it("applies custom className to container", () => {
			const { container } = render(
				<QuestionList questions={mockQuestions} className="custom-class" />,
			);

			expect(container.querySelector(".custom-class")).toBeInTheDocument();
		});
	});
});
