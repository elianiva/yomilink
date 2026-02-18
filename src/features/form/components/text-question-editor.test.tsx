import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
	createDefaultTextData,
	TextQuestionEditor,
} from "./text-question-editor";

describe("TextQuestionEditor", () => {
	const defaultData = createDefaultTextData();

	it("renders the component with default values", () => {
		render(<TextQuestionEditor data={defaultData} onChange={vi.fn()} />);

		expect(screen.getByTestId("text-question-editor")).toBeInTheDocument();
		expect(screen.getByTestId("question-text-input")).toBeInTheDocument();
		expect(screen.getByTestId("min-length-input")).toBeInTheDocument();
		expect(screen.getByTestId("max-length-input")).toBeInTheDocument();
		expect(screen.getByTestId("placeholder-input")).toBeInTheDocument();
		expect(screen.getByTestId("required-toggle")).toBeChecked();
	});

	it("renders question text input and handles changes", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TextQuestionEditor data={defaultData} onChange={onChange} />);

		const textarea = screen.getByTestId("question-text-input");
		await user.type(textarea, "What is your name?");

		expect(onChange).toHaveBeenCalled();
	});

	it("renders and handles min length input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TextQuestionEditor data={defaultData} onChange={onChange} />);

		const minLengthInput = screen.getByTestId("min-length-input");
		await user.type(minLengthInput, "100");

		expect(onChange).toHaveBeenCalled();
	});

	it("renders and handles max length input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TextQuestionEditor data={defaultData} onChange={onChange} />);

		const maxLengthInput = screen.getByTestId("max-length-input");
		await user.type(maxLengthInput, "500");

		expect(onChange).toHaveBeenCalled();
	});

	it("renders and handles placeholder input", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TextQuestionEditor data={defaultData} onChange={onChange} />);

		const placeholderInput = screen.getByTestId("placeholder-input");
		await user.type(placeholderInput, "Test placeholder");

		expect(onChange).toHaveBeenCalled();
	});

	it("shows character count when placeholder has value", () => {
		const data = {
			...createDefaultTextData(),
			placeholder: "Test placeholder",
		};
		render(<TextQuestionEditor data={data} onChange={vi.fn()} />);

		expect(screen.getByTestId("placeholder-input")).toHaveValue(
			"Test placeholder",
		);
	});

	it("toggles required switch", async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		render(<TextQuestionEditor data={defaultData} onChange={onChange} />);

		const requiredSwitch = screen.getByTestId("required-toggle");
		await user.click(requiredSwitch);

		expect(onChange).toHaveBeenCalled();
		const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
		expect(lastCall.required).toBe(false);
	});

	it("disables all inputs when disabled prop is true", () => {
		render(
			<TextQuestionEditor
				data={defaultData}
				onChange={vi.fn()}
				disabled={true}
			/>,
		);

		expect(screen.getByTestId("question-text-input")).toBeDisabled();
		expect(screen.getByTestId("min-length-input")).toBeDisabled();
		expect(screen.getByTestId("max-length-input")).toBeDisabled();
		expect(screen.getByTestId("placeholder-input")).toBeDisabled();
		expect(screen.getByTestId("required-toggle")).toBeDisabled();
	});

	it("shows validation preview when both min and max are set", () => {
		const data = {
			...createDefaultTextData(),
			minLength: 10,
			maxLength: 500,
		};
		render(<TextQuestionEditor data={data} onChange={vi.fn()} />);

		expect(screen.getByTestId("validation-preview")).toBeInTheDocument();
		expect(
			screen.getByText(/must be between 10 and 500 characters/),
		).toBeInTheDocument();
	});

	it("does not show validation preview when min is null", () => {
		const data = {
			...createDefaultTextData(),
			minLength: null,
			maxLength: 500,
		};
		render(<TextQuestionEditor data={data} onChange={vi.fn()} />);

		expect(screen.queryByTestId("validation-preview")).not.toBeInTheDocument();
	});

	it("does not show validation preview when max is null", () => {
		const data = {
			...createDefaultTextData(),
			minLength: 10,
			maxLength: null,
		};
		render(<TextQuestionEditor data={data} onChange={vi.fn()} />);

		expect(screen.queryByTestId("validation-preview")).not.toBeInTheDocument();
	});

	it("clears min length when input is cleared", async () => {
		const user = userEvent.setup();
		const data = {
			...createDefaultTextData(),
			minLength: 10,
		};
		const onChange = vi.fn();
		render(<TextQuestionEditor data={data} onChange={onChange} />);

		const minLengthInput = screen.getByTestId("min-length-input");
		await user.clear(minLengthInput);

		expect(onChange).toHaveBeenCalled();
		const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
		expect(lastCall.minLength).toBeNull();
	});

	it("clears max length when input is cleared", async () => {
		const user = userEvent.setup();
		const data = {
			...createDefaultTextData(),
			maxLength: 500,
		};
		const onChange = vi.fn();
		render(<TextQuestionEditor data={data} onChange={onChange} />);

		const maxLengthInput = screen.getByTestId("max-length-input");
		await user.clear(maxLengthInput);

		expect(onChange).toHaveBeenCalled();
		const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
		expect(lastCall.maxLength).toBeNull();
	});

	it("clears placeholder when input is cleared", async () => {
		const user = userEvent.setup();
		const data = {
			...createDefaultTextData(),
			placeholder: "Test",
		};
		const onChange = vi.fn();
		render(<TextQuestionEditor data={data} onChange={onChange} />);

		const placeholderInput = screen.getByTestId("placeholder-input");
		await user.clear(placeholderInput);

		expect(onChange).toHaveBeenCalled();
		const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
		expect(lastCall.placeholder).toBeNull();
	});

	it("createDefaultTextData returns correct default values", () => {
		const data = createDefaultTextData();

		expect(data.questionText).toBe("");
		expect(data.minLength).toBeNull();
		expect(data.maxLength).toBeNull();
		expect(data.placeholder).toBeNull();
		expect(data.required).toBe(true);
	});
});
