import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { FormList, type FormListItem } from "./form-list";

const mockForms: FormListItem[] = [
	{
		id: "form-1",
		title: "Pre-test Form",
		description: "A pre-test form",
		type: "pre_test",
		status: "published",
		createdAt: new Date("2026-01-15"),
	},
	{
		id: "form-2",
		title: "Post-test Form",
		description: "A post-test form",
		type: "post_test",
		status: "draft",
		createdAt: new Date("2026-01-20"),
	},
	{
		id: "form-3",
		title: "Registration Form",
		type: "registration",
		status: "published",
		createdAt: new Date("2026-01-25"),
	},
];

describe("FormList", () => {
	it("should render empty state when no forms", () => {
		render(<FormList forms={[]} />);
		expect(screen.getByText("No forms found")).toBeInTheDocument();
	});

	it("should render list of forms", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getByText("Pre-test Form")).toBeInTheDocument();
		expect(screen.getByText("Post-test Form")).toBeInTheDocument();
		expect(screen.getByText("Registration Form")).toBeInTheDocument();
	});

	it("should render form descriptions", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getByText("A pre-test form")).toBeInTheDocument();
		expect(screen.getByText("A post-test form")).toBeInTheDocument();
	});

	it("should render form type badges", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getByText("Pre-test")).toBeInTheDocument();
		expect(screen.getByText("Post-test")).toBeInTheDocument();
		expect(screen.getByText("Registration")).toBeInTheDocument();
	});

	it("should render form status badges", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getAllByText("published").length).toBe(2);
		expect(screen.getAllByText("draft").length).toBe(1);
	});

	it("should render creation dates", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getAllByText(/Created:/).length).toBe(3);
	});

	it("should call onEdit when edit button clicked", async () => {
		const user = userEvent.setup();
		const onEdit = vi.fn();
		render(<FormList forms={[mockForms[0]]} onEdit={onEdit} />);

		const editButton = screen.getByTitle("Edit");
		await user.click(editButton);
		expect(onEdit).toHaveBeenCalledWith(mockForms[0]);
	});

	it("should show edit and delete buttons when handlers provided", () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();
		render(<FormList forms={[mockForms[0]]} onEdit={onEdit} onDelete={onDelete} />);

		expect(screen.getByTitle("Edit")).toBeInTheDocument();
		expect(screen.getByTitle("Delete")).toBeInTheDocument();
	});

	it("should not show action buttons when no handlers provided", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.queryByTitle("Edit")).not.toBeInTheDocument();
		expect(screen.queryByTitle("Delete")).not.toBeInTheDocument();
	});

	it("should handle forms without description", () => {
		const formsWithoutDescription: FormListItem[] = [
			{
				id: "form-1",
				title: "Form without description",
				type: "pre_test",
				status: "draft",
			},
		];
		render(<FormList forms={formsWithoutDescription} />);
		expect(screen.getByText("Form without description")).toBeInTheDocument();
	});

	it("should handle forms without createdAt", () => {
		const formsWithoutDate: FormListItem[] = [
			{
				id: "form-1",
				title: "Form without date",
				type: "pre_test",
				status: "draft",
			},
		];
		render(<FormList forms={formsWithoutDate} />);
		expect(screen.getByText("Form without date")).toBeInTheDocument();
	});
});
