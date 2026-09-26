import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NavigationDrawer } from "../../components/NavigationDrawer";

describe("NavigationDrawer component", () => {
  it("renders all 4 lossless tools with their status badges", () => {
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={vi.fn()}
        currentRoute="trim"
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.getByText("Trim Video")).toBeInTheDocument();
    expect(screen.getByText("Extract Audio")).toBeInTheDocument();
    expect(screen.getByText("Remove Streams")).toBeInTheDocument();
    expect(screen.getByText("Switch Container")).toBeInTheDocument();

    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getAllByText("Coming Soon")).toHaveLength(3);
  });

  it("calls onNavigate and onClose when a tool is clicked", () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <NavigationDrawer
        isOpen={true}
        onClose={handleClose}
        currentRoute="trim"
        onNavigate={handleNavigate}
      />,
    );

    const extractAudioBtn = screen.getByText("Extract Audio").closest("button");
    fireEvent.click(extractAudioBtn);

    expect(handleNavigate).toHaveBeenCalledWith("extract-audio");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes when the close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={handleClose}
        currentRoute="trim"
        onNavigate={vi.fn()}
      />,
    );

    const closeBtn = screen.getByRole("button", { name: /Close menu/i });
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("closes when Escape key is pressed", () => {
    const handleClose = vi.fn();
    render(
      <NavigationDrawer
        isOpen={true}
        onClose={handleClose}
        currentRoute="trim"
        onNavigate={vi.fn()}
      />,
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
