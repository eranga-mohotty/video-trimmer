import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimeInputs } from "../../components/TimeInputs";

describe("TimeInputs component", () => {
  it("renders controlled start and end inputs with formatted times", () => {
    render(
      <TimeInputs
        startTime={3.5}
        endTime={14.8}
        duration={30}
        disabled={false}
        isProcessing={false}
        onStartTimeChange={vi.fn()}
        onEndTimeChange={vi.fn()}
        onConvert={vi.fn()}
      />,
    );

    const startInput = screen.getByLabelText(/Start/i);
    const endInput = screen.getByLabelText(/End/i);

    expect(startInput).toHaveValue(3.5);
    expect(endInput).toHaveValue(14.8);
    expect(screen.getByText("(0:03.5)")).toBeInTheDocument();
    expect(screen.getByText("(0:14.8)")).toBeInTheDocument();
  });

  it("calls onStartTimeChange and onEndTimeChange on user input", () => {
    const handleStartChange = vi.fn();
    const handleEndChange = vi.fn();

    render(
      <TimeInputs
        startTime={0}
        endTime={20}
        duration={50}
        disabled={false}
        isProcessing={false}
        onStartTimeChange={handleStartChange}
        onEndTimeChange={handleEndChange}
        onConvert={vi.fn()}
      />,
    );

    const startInput = screen.getByLabelText(/Start/i);
    fireEvent.change(startInput, { target: { value: "5.2" } });
    expect(handleStartChange).toHaveBeenCalledWith(5.2);

    const endInput = screen.getByLabelText(/End/i);
    fireEvent.change(endInput, { target: { value: "18.5" } });
    expect(handleEndChange).toHaveBeenCalledWith(18.5);
  });

  it("calls onConvert when the convert button is clicked", () => {
    const handleConvert = vi.fn();

    render(
      <TimeInputs
        startTime={0}
        endTime={10}
        duration={20}
        disabled={false}
        isProcessing={false}
        onStartTimeChange={vi.fn()}
        onEndTimeChange={vi.fn()}
        onConvert={handleConvert}
      />,
    );

    const button = screen.getByRole("button", {
      name: /Convert & Trim Video/i,
    });
    fireEvent.click(button);

    expect(handleConvert).toHaveBeenCalledTimes(1);
  });

  it("displays loading state and disables button when isProcessing is true", () => {
    render(
      <TimeInputs
        startTime={0}
        endTime={10}
        duration={20}
        disabled={true}
        isProcessing={true}
        onStartTimeChange={vi.fn()}
        onEndTimeChange={vi.fn()}
        onConvert={vi.fn()}
      />,
    );

    expect(screen.getByText(/Processing Video.../i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Processing Video.../i }),
    ).toBeDisabled();
    expect(screen.getByLabelText(/Start/i)).toBeDisabled();
    expect(screen.getByLabelText(/End/i)).toBeDisabled();
  });
});
