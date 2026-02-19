import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CountdownTimer, createDefaultCountdownData } from "./countdown-timer";

describe("CountdownTimer", () => {
	it("renders with future date and shows countdown", () => {
		const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now

		render(<CountdownTimer targetDate={futureDate} />);

		expect(screen.getByText(/Unlocks in/)).toBeInTheDocument();
	});

	it("shows days when greater than 0", () => {
		const futureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

		render(<CountdownTimer targetDate={futureDate} />);

		expect(screen.getByText("d")).toBeInTheDocument();
	});

	it("shows hours when days are 0 but hours > 0", () => {
		const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

		render(<CountdownTimer targetDate={futureDate} />);

		expect(screen.getByText("h")).toBeInTheDocument();
	});

	it("shows minutes when hours are 0 but minutes > 0", () => {
		const futureDate = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

		render(<CountdownTimer targetDate={futureDate} />);

		expect(screen.getByText("m")).toBeInTheDocument();
	});

	it("shows seconds when only seconds remaining", () => {
		const futureDate = new Date(Date.now() + 45 * 1000); // 45 seconds from now

		render(<CountdownTimer targetDate={futureDate} />);

		expect(screen.getByText("s")).toBeInTheDocument();
	});

	it("shows 'Available now' when target date is in the past", () => {
		const pastDate = new Date(Date.now() - 1000); // 1 second ago

		render(<CountdownTimer targetDate={pastDate} />);

		expect(screen.getByText("Available now")).toBeInTheDocument();
	});

	it("respects showDays prop", () => {
		const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

		render(<CountdownTimer targetDate={futureDate} showDays={false} />);

		expect(screen.queryByText("d")).not.toBeInTheDocument();
	});

	it("respects showHours prop", () => {
		const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

		render(<CountdownTimer targetDate={futureDate} showHours={false} />);

		expect(screen.queryByText("h")).not.toBeInTheDocument();
	});

	it("respects showMinutes prop", () => {
		const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

		render(<CountdownTimer targetDate={futureDate} showMinutes={false} />);

		expect(screen.queryByText("m")).not.toBeInTheDocument();
	});

	it("accepts string date input", () => {
		const futureDate = new Date(
			Date.now() + 2 * 24 * 60 * 60 * 1000,
		).toISOString();

		const { container } = render(<CountdownTimer targetDate={futureDate} />);

		expect(container).toBeInTheDocument();
	});

	it("accepts number timestamp input", () => {
		const futureTimestamp = Date.now() + 2 * 24 * 60 * 60 * 1000;

		const { container } = render(
			<CountdownTimer targetDate={futureTimestamp} />,
		);

		expect(container).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

		const { container } = render(
			<CountdownTimer targetDate={futureDate} className="custom-class" />,
		);

		expect(container.firstChild).toHaveClass("custom-class");
	});
});

describe("createDefaultCountdownData", () => {
	it("returns default countdown display options", () => {
		const defaults = createDefaultCountdownData();

		expect(defaults.showDays).toBe(true);
		expect(defaults.showHours).toBe(true);
		expect(defaults.showMinutes).toBe(true);
		expect(defaults.showSeconds).toBe(true);
	});
});
