import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormList, type FormListItem } from "./form-list";

const mockForms: FormListItem[] = [
	{
		id: "form-1",
		title: "Pre-test Form",
		description: "A pre-test form",
		type: "pre_test",
		status: "published",
		formStatus: "available",
		createdAt: new Date("2026-01-15"),
	},
	{
		id: "form-2",
		title: "Post-test Form",
		description: "A post-test form",
		type: "post_test",
		status: "draft",
		formStatus: "locked",
		createdAt: new Date("2026-01-20"),
	},
	{
		id: "form-3",
		title: "Registration Form",
		type: "registration",
		status: "published",
		formStatus: "completed",
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

	it("should render form list status badges", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getByText("Available")).toBeInTheDocument();
		expect(screen.getByText("Locked")).toBeInTheDocument();
		expect(screen.getByText("Completed")).toBeInTheDocument();
	});

	it("should render creation dates", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.getAllByText(/Created:/).length).toBe(3);
	});

	it("should call onClick when form is clicked", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(<FormList forms={mockForms} onClick={onClick} />);

		await user.click(screen.getByText("Pre-test Form"));
		expect(onClick).toHaveBeenCalledWith(mockForms[0]);
	});

	it("should show dropdown menu with edit and delete options", () => {
		const onEdit = vi.fn();
		const onDelete = vi.fn();
		render(<FormList forms={[mockForms[0]]} onEdit={onEdit} onDelete={onDelete} />);

		const moreButton = screen.getByRole("button", { hidden: true });
		expect(moreButton).toBeInTheDocument();
	});

	it("should not show dropdown menu when no handlers provided", () => {
		render(<FormList forms={mockForms} />);
		expect(screen.queryByRole("button", { name: /more/i })).not.toBeInTheDocument();
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

	it("should apply custom className", () => {
		render(<FormList forms={mockForms} className="custom-class" />);
		const container = screen.getByText("Pre-test Form").closest(".custom-class");
		expect(container).toBeInTheDocument();
	});

	it("should render correct badge colors for status", () => {
		render(<FormList forms={mockForms} />);
		const draftBadges = screen.getAllByText("draft");
		const publishedBadges = screen.getAllByText("published");

		expect(draftBadges[0].closest("span")).toHaveClass("bg-yellow-500");
		expect(publishedBadges[0].closest("span")).toHaveClass("bg-green-500");
	});

	it("should render correct badge colors for form list status", () => {
		render(<FormList forms={mockForms} />);
		const lockedBadge = screen.getByText("Locked");
		const availableBadge = screen.getByText("Available");
		const completedBadge = screen.getByText("Completed");

		expect(lockedBadge.closest("span")).toHaveClass("bg-red-500");
		expect(availableBadge.closest("span")).toHaveClass("bg-blue-500");
		expect(completedBadge.closest("span")).toHaveClass("bg-green-500");
	});

	it("should not render form list status when undefined", () => {
		const formsWithoutListStatus: FormListItem[] = [
			{
				id: "form-1",
				title: "Form without list status",
				type: "pre_test",
				status: "published",
			},
		];
		render(<FormList forms={formsWithoutListStatus} />);
		expect(screen.queryByText("Locked")).not.toBeInTheDocument();
		expect(screen.queryByText("Available")).not.toBeInTheDocument();
		expect(screen.queryByText("Completed")).not.toBeInTheDocument();
	});
});
