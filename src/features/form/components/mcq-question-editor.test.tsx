import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { type McqQuestionData, McqQuestionEditor } from "./mcq-question-editor";

function createDefaultData(overrides: Partial<McqQuestionData> = {}): McqQuestionData {
	return {
		questionText: "",
		options: [
			{ id: "opt_1", text: "" },
			{ id: "opt_2", text: "" },
		],
		correctOptionIds: [],
		shuffle: false,
		required: true,
		...overrides,
	};
}

describe("McqQuestionEditor", () => {
	describe("rendering", () => {
		it("renders question text textarea", () => {
			render(<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} />);

			expect(screen.getByTestId("question-text-input")).toBeInTheDocument();
			expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
		});

		it("renders option rows for each option", () => {
			render(<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} />);

			expect(screen.getByTestId("option-row-0")).toBeInTheDocument();
			expect(screen.getByTestId("option-row-1")).toBeInTheDocument();
		});

		it("renders add option button", () => {
			render(<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} />);

			expect(screen.getByTestId("add-option-button")).toBeInTheDocument();
		});

		it("renders shuffle toggle", () => {
			render(<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} />);

			expect(screen.getByTestId("shuffle-toggle")).toBeInTheDocument();
		});

		it("renders required toggle", () => {
			render(<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} />);

			expect(screen.getByTestId("required-toggle")).toBeInTheDocument();
		});

		it("displays question text value", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({ questionText: "What is 2+2?" })}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByDisplayValue("What is 2+2?")).toBeInTheDocument();
		});

		it("displays option text values", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "3" },
							{ id: "opt_2", text: "4" },
						],
					})}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByDisplayValue("3")).toBeInTheDocument();
			expect(screen.getByDisplayValue("4")).toBeInTheDocument();
		});

		it("shows correct answers checked", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "3" },
							{ id: "opt_2", text: "4" },
						],
						correctOptionIds: ["opt_2"],
					})}
					onChange={vi.fn()}
				/>,
			);

			const checkboxes = screen.getAllByRole("checkbox");
			expect(checkboxes[0]).not.toBeChecked();
			expect(checkboxes[1]).toBeChecked();
		});

		it("shows shuffle state", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({ shuffle: true })}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByTestId("shuffle-toggle")).toHaveAttribute("data-state", "checked");
		});

		it("shows required state", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({ required: false })}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByTestId("required-toggle")).toHaveAttribute(
				"data-state",
				"unchecked",
			);
		});
	});

	describe("interactions", () => {
		it("calls onChange when question text changes", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<McqQuestionEditor data={createDefaultData()} onChange={handleChange} />);

			const input = screen.getByTestId("question-text-input");
			await user.clear(input);
			await user.paste("What?");

			expect(handleChange).toHaveBeenCalled();
			const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
			expect(lastCall[0].questionText).toBe("What?");
		});

		it("calls onChange when option text changes", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "" },
							{ id: "opt_2", text: "" },
						],
					})}
					onChange={handleChange}
				/>,
			);

			const input = screen.getByTestId("option-input-0");
			await user.clear(input);
			await user.paste("Option A");

			expect(handleChange).toHaveBeenCalled();
			const lastCall = handleChange.mock.calls[handleChange.mock.calls.length - 1];
			expect(lastCall[0].options[0].text).toBe("Option A");
		});

		it("calls onChange when correct answer is toggled", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [{ id: "opt_1", text: "A" }],
						correctOptionIds: [],
					})}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("correct-checkbox-0"));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({
					correctOptionIds: ["opt_1"],
				}),
			);
		});

		it("calls onChange when shuffle is toggled", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({ shuffle: false })}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("shuffle-toggle"));

			expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ shuffle: true }));
		});

		it("calls onChange when required is toggled", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({ required: true })}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("required-toggle"));

			expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ required: false }));
		});

		it("adds new option when add button clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(<McqQuestionEditor data={createDefaultData()} onChange={handleChange} />);

			await user.click(screen.getByTestId("add-option-button"));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({
					options: expect.arrayContaining([expect.objectContaining({ text: "" })]),
				}),
			);
			expect(handleChange.mock.calls[0][0].options).toHaveLength(3);
		});

		it("removes option when remove button clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
							{ id: "opt_3", text: "C" },
						],
					})}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("remove-option-1"));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({
					options: [
						{ id: "opt_1", text: "A" },
						{ id: "opt_3", text: "C" },
					],
				}),
			);
		});

		it("removes option from correctOptionIds when deleted", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
							{ id: "opt_3", text: "C" },
						],
						correctOptionIds: ["opt_2"],
					})}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("remove-option-1"));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({
					correctOptionIds: [],
				}),
			);
		});

		it("moves option up when move up clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
						],
					})}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("move-up-1"));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({
					options: [
						{ id: "opt_2", text: "B" },
						{ id: "opt_1", text: "A" },
					],
				}),
			);
		});

		it("moves option down when move down clicked", async () => {
			const user = userEvent.setup();
			const handleChange = vi.fn();

			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
						],
					})}
					onChange={handleChange}
				/>,
			);

			await user.click(screen.getByTestId("move-down-0"));

			expect(handleChange).toHaveBeenCalledWith(
				expect.objectContaining({
					options: [
						{ id: "opt_2", text: "B" },
						{ id: "opt_1", text: "A" },
					],
				}),
			);
		});
	});

	describe("disabled state", () => {
		it("disables all inputs when disabled prop is true", () => {
			render(
				<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} disabled={true} />,
			);

			expect(screen.getByTestId("question-text-input")).toBeDisabled();
			expect(screen.getByTestId("option-input-0")).toBeDisabled();
			expect(screen.getByTestId("add-option-button")).toBeDisabled();
		});

		it("disables remove button when only 2 options remain", () => {
			render(<McqQuestionEditor data={createDefaultData()} onChange={vi.fn()} />);

			expect(screen.getByTestId("remove-option-0")).toBeDisabled();
			expect(screen.getByTestId("remove-option-1")).toBeDisabled();
		});

		it("disables add button when at max options (10)", () => {
			const tenOptions = Array.from({ length: 10 }, (_, i) => ({
				id: `opt_${i}`,
				text: `Option ${i + 1}`,
			}));

			render(
				<McqQuestionEditor
					data={createDefaultData({ options: tenOptions })}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByTestId("add-option-button")).toBeDisabled();
		});

		it("disables move up button for first option", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
						],
					})}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByTestId("move-up-0")).toBeDisabled();
			expect(screen.getByTestId("move-up-1")).not.toBeDisabled();
		});

		it("disables move down button for last option", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
						],
					})}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByTestId("move-down-1")).toBeDisabled();
			expect(screen.getByTestId("move-down-0")).not.toBeDisabled();
		});
	});

	describe("visual feedback", () => {
		it("shows correct answer visual indication", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "Wrong" },
							{ id: "opt_2", text: "Correct" },
						],
						correctOptionIds: ["opt_2"],
					})}
					onChange={vi.fn()}
				/>,
			);

			const rows = screen.getAllByTestId(/option-row-/);
			expect(rows[1]).toHaveClass("border-green-500/50");
		});

		it("displays option count", () => {
			render(
				<McqQuestionEditor
					data={createDefaultData({
						options: [
							{ id: "opt_1", text: "A" },
							{ id: "opt_2", text: "B" },
							{ id: "opt_3", text: "C" },
						],
					})}
					onChange={vi.fn()}
				/>,
			);

			expect(screen.getByText("3 options")).toBeInTheDocument();
		});
	});
});
