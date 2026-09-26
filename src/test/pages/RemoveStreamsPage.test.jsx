import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RemoveStreamsPage } from "../../pages/RemoveStreamsPage";

describe("RemoveStreamsPage component", () => {
  const mockRemoveStreams = vi.fn().mockResolvedValue("blob:http://localhost/processed-video");
  const mockFfmpegEngine = {
    isLoaded: true,
    isProcessing: false,
    progress: 0,
    processingStage: "",
    logMessage: "",
    removeStreams: mockRemoveStreams,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tool header and stream checkboxes when a video is loaded", () => {
    render(<RemoveStreamsPage ffmpegEngine={mockFfmpegEngine} />);

    expect(screen.getByText(/Remove Streams & Mute Video/i)).toBeInTheDocument();

    const file = new File(["dummy"], "video.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByLabelText(/Remove Audio \(Mute Video\)/i)).toBeChecked();
    expect(screen.getByLabelText(/Remove Subtitles/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Remove Metadata & Data Streams/i)).not.toBeChecked();
  });

  it("disables strip button when all options are unchecked", () => {
    render(<RemoveStreamsPage ffmpegEngine={mockFfmpegEngine} />);

    const file = new File(["dummy"], "video.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const audioCheckbox = screen.getByLabelText(/Remove Audio \(Mute Video\)/i);
    fireEvent.click(audioCheckbox); // Uncheck it

    const processBtn = screen.getByRole("button", { name: /Strip Selected Streams/i });
    expect(processBtn).toBeDisabled();
    expect(screen.getByText(/Please select at least one stream removal option/i)).toBeInTheDocument();
  });

  it("triggers removeStreams with selected stream flags", async () => {
    render(<RemoveStreamsPage ffmpegEngine={mockFfmpegEngine} />);

    const file = new File(["dummy"], "video.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [file] } });

    const subtitleCheckbox = screen.getByLabelText(/Remove Subtitles/i);
    fireEvent.click(subtitleCheckbox); // Check subtitles

    const processBtn = screen.getByRole("button", { name: /Strip Selected Streams/i });
    fireEvent.click(processBtn);

    await waitFor(() => {
      expect(mockRemoveStreams).toHaveBeenCalledWith(file, {
        removeAudio: true,
        removeSubtitles: true,
        removeMetadata: false,
      });
    });
  });
});
