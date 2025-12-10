import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Guard } from "@/components/auth/Guard";

vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "u", role: "teacher", email: null, name: null } }) }));

describe("Guard", () => {
  it("renders children when role matches", () => {
    render(
      <Guard roles={["teacher", "admin"]}>
        <div>content</div>
      </Guard>,
    );
    expect(screen.getByText("content")).toBeDefined();
  });

  it("renders fallback when provided and role mismatches", async () => {
    vi.doMock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { id: "u", role: "student", email: null, name: null } }) }));
    const Fallback = () => <div>nope</div>;
    render(
      <Guard roles={["teacher"]} fallback={<Fallback />}>
        <div>content</div>
      </Guard>,
    );
    expect(screen.getByText("nope")).toBeDefined();
  });
});
