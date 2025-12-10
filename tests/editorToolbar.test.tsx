import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EditorToolbar from "@/components/goalmap/EditorToolbar";

function click(btnTitle: string) {
  fireEvent.click(screen.getByTitle(btnTitle));
}

describe("EditorToolbar", () => {
  it("invokes all handlers on button clicks", () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onFit = vi.fn();
    const onDelete = vi.fn();
    const onSaveClick = vi.fn();
    const onExport = vi.fn();

    render(
      <EditorToolbar
        onUndo={onUndo}
        onRedo={onRedo}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onFit={onFit}
        onDelete={onDelete}
        onSaveClick={onSaveClick}
        onExport={onExport}
        saving={false}
        isDirty={true}
      />,
    );

    click("Undo");
    click("Redo");
    click("Zoom out");
    click("Zoom in");
    click("Fit view");
    click("Delete selected");
    fireEvent.click(screen.getByText(/^Save$/));
    fireEvent.click(screen.getByText(/Export Kit/i));

    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).toHaveBeenCalled();
    expect(onZoomIn).toHaveBeenCalled();
    expect(onZoomOut).toHaveBeenCalled();
    expect(onFit).toHaveBeenCalled();
    expect(onDelete).toHaveBeenCalled();
    expect(onSaveClick).toHaveBeenCalled();
    expect(onExport).toHaveBeenCalled();
  });
});
