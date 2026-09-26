import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar } from "../../components/ProgressBar";

describe("ProgressBar component", () => {
  it("returns null when not processing and no stage", () => {
    const { container } = render(
      <ProgressBar isProcessing={false} progress={0} stage="" logMessage="" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders stage description, progress percentage, and log message", () => {
    render(
      <ProgressBar
        isProcessing={true}
        progress={65}
        stage="Trimming video... 65%"
        logMessage="frame=120 fps=30 q=-1.0 size=1024kB"
      />,
    );

    expect(screen.getByText("Trimming video... 65%")).toBeInTheDocument();
    expect(screen.getByText("65%")).toBeInTheDocument();
    expect(
      screen.getByText("frame=120 fps=30 q=-1.0 size=1024kB"),
    ).toBeInTheDocument();
  });

  it("shows completed status style when progress is 100% and not processing", () => {
    const { container } = render(
      <ProgressBar
        isProcessing={false}
        progress={100}
        stage="Trimming complete!"
        logMessage=""
      />,
    );

    expect(screen.getByText("Trimming complete!")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    // Inner bar should have bg-green-500 class
    const innerBar = container.querySelector(".bg-green-500");
    expect(innerBar).toBeInTheDocument();
  });
});
