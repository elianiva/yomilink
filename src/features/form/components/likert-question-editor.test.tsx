import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	createDefaultLikertData,
	type LikertQuestionData,
	LikertQuestionEditor,
} from "./likert-question-editor";

function createDefaultData(
	overrides: Partial<LikertQuestionData> = {},
): LikertQuestionData {
	return {
		questionText: "",
		scaleSize: 5,
		labels: {
			"1": "Strongly Disagree",
			"2": "Disagree",
			"3": "Neutral",
			"4": "Agree",
			"5": "Strongly Agree",
		},
		required: true,
		...overrides,
	};
}

describe("LikertQuestionEditor", () => {
	describe("rendering", () => {
		it("renders question text textarea", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("question-text-input")).toBeInTheDocument();
			expect(screen.getByLabelText(/question text/i)).toBeInTheDocument();
		});

		it("renders scale size buttons", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("scale-size-buttons")).toBeInTheDocument();
			expect(screen.getByTestId("scale-size-5")).toBeInTheDocument();
			expect(screen.getByTestId("scale-size-7")).toBeInTheDocument();
		});

		it("renders label inputs for each scale point", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("label-input-1")).toBeInTheDocument();
			expect(screen.getByTestId("label-input-5")).toBeInTheDocument();
		});

		it("renders required toggle", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("required-toggle")).toBeInTheDocument();
		});

		it("renders preview label", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("preview-label")).toBeInTheDocument();
		});

		it("renders reset labels button", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("reset-labels-button")).toBeInTheDocument();
		});

		it("applies correct styling for the editor container", () => {
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={vi.fn()} />,
			);

			expect(screen.getByTestId("likert-question-editor")).toHaveClass(
				"space-y-6",
			);
		});
	});

	describe("interactions", () => {
		it("calls onChange when question text changes", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={onChange} />,
			);

			await user.type(
				screen.getByTestId("question-text-input"),
				"Test question?",
			);

			expect(onChange).toHaveBeenCalled();
		});

		it("calls onChange when scale size button is clicked", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={onChange} />,
			);

			await user.click(screen.getByTestId("scale-size-7"));

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					scaleSize: 7,
				}),
			);
		});

		it("calls onChange when required toggle is clicked", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={onChange} />,
			);

			await user.click(screen.getByTestId("required-toggle"));

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					required: false,
				}),
			);
		});

		it("calls onChange when label input changes", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={onChange} />,
			);

			const input = screen.getByTestId("label-input-1");
			await user.click(input);
			await user.keyboard("{Control>}a{/Control}");
			await user.keyboard("Very bad");

			expect(onChange).toHaveBeenCalled();
		});

		it("calls onChange when reset labels button is clicked", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			const customLabels = {
				"1": "Custom 1",
				"2": "Custom 2",
				"3": "Custom 3",
				"4": "Custom 4",
				"5": "Custom 5",
			};
			render(
				<LikertQuestionEditor
					data={createDefaultData({ labels: customLabels })}
					onChange={onChange}
				/>,
			);

			await user.click(screen.getByTestId("reset-labels-button"));

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					labels: expect.objectContaining({
						"1": "Strongly Disagree",
						"5": "Strongly Agree",
					}),
				}),
			);
		});
	});

	describe("scale size behavior", () => {
		it("updates label count when scale size changes to 7", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<LikertQuestionEditor data={createDefaultData()} onChange={onChange} />,
			);

			await user.click(screen.getByTestId("scale-size-7"));

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					scaleSize: 7,
					labels: expect.objectContaining({
						"7": "7",
					}),
				}),
			);
		});

		it("reduces labels when scale size decreases", async () => {
			const user = userEvent.setup();
			const onChange = vi.fn();
			render(
				<LikertQuestionEditor
					data={createDefaultData({ scaleSize: 7 })}
					onChange={onChange}
				/>,
			);

			await user.click(screen.getByTestId("scale-size-3"));

			expect(onChange).toHaveBeenCalledWith(
				expect.objectContaining({
					scaleSize: 3,
				}),
			);
		});

		it("displays correct preview for different scale sizes", () => {
			render(
				<LikertQuestionEditor
					data={createDefaultData({ scaleSize: 7 })}
					onChange={vi.fn()}
				/>,
			);

			const preview = screen.getByTestId("preview-label");
			expect(preview).toHaveTextContent(/7 = "7"/);
		});
	});

	describe("disabled state", () => {
		it("disables question text input when disabled", () => {
			render(
				<LikertQuestionEditor
					data={createDefaultData()}
					onChange={vi.fn()}
					disabled={true}
				/>,
			);

			expect(screen.getByTestId("question-text-input")).toBeDisabled();
		});

		it("disables scale size buttons when disabled", () => {
			render(
				<LikertQuestionEditor
					data={createDefaultData()}
					onChange={vi.fn()}
					disabled={true}
				/>,
			);

			expect(screen.getByTestId("scale-size-5")).toBeDisabled();
		});

		it("disables label inputs when disabled", () => {
			render(
				<LikertQuestionEditor
					data={createDefaultData()}
					onChange={vi.fn()}
					disabled={true}
				/>,
			);

			expect(screen.getByTestId("label-input-1")).toBeDisabled();
		});

		it("disables required toggle when disabled", () => {
			render(
				<LikertQuestionEditor
					data={createDefaultData()}
					onChange={vi.fn()}
					disabled={true}
				/>,
			);

			expect(screen.getByTestId("required-toggle")).toBeDisabled();
		});
	});

	describe("createDefaultLikertData", () => {
		it("creates default data with 5-point scale", () => {
			const data = createDefaultLikertData();

			expect(data.scaleSize).toBe(5);
			expect(data.labels).toEqual({
				"1": "Strongly Disagree",
				"2": "Disagree",
				"3": "Neutral",
				"4": "Agree",
				"5": "Strongly Agree",
			});
		});

		it("creates default data with required set to true", () => {
			const data = createDefaultLikertData();

			expect(data.required).toBe(true);
		});

		it("creates default data with empty question text", () => {
			const data = createDefaultLikertData();

			expect(data.questionText).toBe("");
		});
	});

	describe("preview", () => {
		it("shows preview text with label values", () => {
			render(
				<LikertQuestionEditor
					data={createDefaultData({
						labels: {
							"1": "Very Bad",
							"2": "Bad",
							"3": "Okay",
							"4": "Good",
							"5": "Very Good",
						},
					})}
					onChange={vi.fn()}
				/>,
			);

			const preview = screen.getByTestId("preview-label");
			expect(preview).toHaveTextContent(/1 = "Very Bad"/);
			expect(preview).toHaveTextContent(/5 = "Very Good"/);
		});
	});
});
