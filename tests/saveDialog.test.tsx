import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SaveDialog, type SaveMeta } from "@/components/goalmap/SaveDialog";

function openDialog(overrides: Partial<React.ComponentProps<typeof SaveDialog>> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  render(
    <SaveDialog
      open
      saving={false}
      defaultTopic="Topic"
      defaultName="Map Name"
      onCancel={onCancel}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );
  return { onCancel, onConfirm };
}

describe("SaveDialog", () => {
  it("renders defaults", async () => {
    openDialog();
    // Defaults rendered
    const topic = screen.getByLabelText(/Topic/i) as HTMLInputElement;
    const name = screen.getByLabelText(/Map Name/i) as HTMLInputElement;
    expect(topic.value).toBe("Topic");
    expect(name.value).toBe("Map Name");
  });

  it("calls onCancel when Cancel clicked", async () => {
    const { onCancel } = openDialog();
    fireEvent.click(screen.getAllByText(/Cancel/i)[0]);
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onConfirm with trimmed values", async () => {
    const { onConfirm } = openDialog({ defaultTopic: " T ", defaultName: " N " });
    fireEvent.click(screen.getByText(/^Save$/));
    expect(onConfirm).toHaveBeenCalledWith({ topic: "T", name: "N" } as SaveMeta);
  });
});
