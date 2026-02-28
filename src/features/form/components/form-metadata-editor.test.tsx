import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { type FormMetadata, FormMetadataEditor } from "./form-metadata-editor";

describe("FormMetadataEditor", () => {
	const defaultMetadata: FormMetadata = {
		title: "",
		description: null,
		type: "registration",
		status: "draft",
	};

	it("renders with all form fields", () => {
		render(<FormMetadataEditor metadata={defaultMetadata} onChange={vi.fn()} />);

		expect(screen.getByTestId("form-metadata-editor")).toBeInTheDocument();
		expect(screen.getByTestId("form-title-input")).toBeInTheDocument();
		expect(screen.getByTestId("form-description-input")).toBeInTheDocument();
		expect(screen.getByTestId("form-type-select")).toBeInTheDocument();
		expect(screen.getByTestId("form-status-select")).toBeInTheDocument();
	});

	it("displays initial metadata values", () => {
		const metadata: FormMetadata = {
			title: "Test Form",
			description: "Test Description",
			type: "pre_test",
			status: "published",
		};

		render(<FormMetadataEditor metadata={metadata} onChange={vi.fn()} />);

		expect(screen.getByTestId("form-title-input")).toHaveValue("Test Form");
		expect(screen.getByTestId("form-description-input")).toHaveValue("Test Description");
	});

	it("calls onChange when title is updated", () => {
		const onChange = vi.fn();

		render(<FormMetadataEditor metadata={defaultMetadata} onChange={onChange} />);

		const titleInput = screen.getByTestId("form-title-input");
		fireEvent.change(titleInput, { target: { value: "New Form Title" } });

		expect(onChange).toHaveBeenCalledWith({
			...defaultMetadata,
			title: "New Form Title",
		});
	});

	it("calls onChange when description is updated", () => {
		const onChange = vi.fn();

		render(<FormMetadataEditor metadata={defaultMetadata} onChange={onChange} />);

		const descriptionInput = screen.getByTestId("form-description-input");
		fireEvent.change(descriptionInput, {
			target: { value: "New Description" },
		});

		expect(onChange).toHaveBeenCalledWith({
			...defaultMetadata,
			description: "New Description",
		});
	});

	it("calls onChange with null when description is cleared", () => {
		const onChange = vi.fn();
		const metadataWithDescription: FormMetadata = {
			...defaultMetadata,
			description: "Existing Description",
		};

		render(<FormMetadataEditor metadata={metadataWithDescription} onChange={onChange} />);

		const descriptionInput = screen.getByTestId("form-description-input");
		fireEvent.change(descriptionInput, { target: { value: "" } });

		expect(onChange).toHaveBeenCalledWith({
			...defaultMetadata,
			description: null,
		});
	});

	it("disables all inputs when disabled prop is true", () => {
		render(
			<FormMetadataEditor metadata={defaultMetadata} onChange={vi.fn()} disabled={true} />,
		);

		expect(screen.getByTestId("form-title-input")).toBeDisabled();
		expect(screen.getByTestId("form-description-input")).toBeDisabled();
		expect(screen.getByTestId("form-type-select")).toBeDisabled();
		expect(screen.getByTestId("form-status-select")).toBeDisabled();
	});
});
