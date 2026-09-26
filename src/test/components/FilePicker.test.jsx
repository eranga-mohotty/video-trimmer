import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilePicker } from "../../components/FilePicker";

describe("FilePicker component", () => {
  it("renders 'Select Video' when no file is chosen", () => {
    render(
      <FilePicker
        selectedFile={null}
        onFileSelect={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getByText("Select Video")).toBeInTheDocument();
  });

  it("renders file details when a file is selected", () => {
    const mockFile = new File(["sample content"], "holiday_clip.mp4", {
      type: "video/mp4",
    });
    // Define size
    Object.defineProperty(mockFile, "size", { value: 5 * 1024 * 1024 });

    render(
      <FilePicker
        selectedFile={mockFile}
        onFileSelect={vi.fn()}
        disabled={false}
      />,
    );

    expect(screen.getByText("Choose Different Video")).toBeInTheDocument();
    expect(screen.getByText(/holiday_clip.mp4/i)).toBeInTheDocument();
    expect(screen.getByText(/5.0 MB/i)).toBeInTheDocument();
  });

  it("calls onFileSelect when a file is selected", () => {
    const handleSelect = vi.fn();
    render(
      <FilePicker
        selectedFile={null}
        onFileSelect={handleSelect}
        disabled={false}
      />,
    );

    const input = document.getElementById("videoPicker");
    const testFile = new File(["test"], "my_video.mp4", {
      type: "video/mp4",
    });

    fireEvent.change(input, { target: { files: [testFile] } });
    expect(handleSelect).toHaveBeenCalledWith(testFile);
  });

  it("disables file input when disabled prop is true", () => {
    render(
      <FilePicker selectedFile={null} onFileSelect={vi.fn()} disabled={true} />,
    );

    const input = document.getElementById("videoPicker");
    expect(input).toBeDisabled();
  });
});
