import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TrimPage } from "../../pages/TrimPage";

describe("TrimPage component", () => {
  const mockFfmpegEngine = {
    isLoaded: true,
    isProcessing: false,
    progress: 0,
    processingStage: "",
    logMessage: "",
    trimVideo: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders FilePicker and keyframe notice without crashing", () => {
    render(<TrimPage ffmpegEngine={mockFfmpegEngine} />);

    expect(screen.getByText("Select Video")).toBeInTheDocument();
  });

  it("displays MKV compatibility alert when an MKV file is selected", () => {
    render(<TrimPage ffmpegEngine={mockFfmpegEngine} />);

    const mkvFile = new File(["dummy content"], "movie.mkv", {
      type: "video/x-matroska",
    });

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mkvFile] } });

    expect(
      screen.getByText(/In-browser video playback may not be supported for MKV files/i),
    ).toBeInTheDocument();
  });

  it("does not show MKV compatibility alert for regular MP4 files", () => {
    render(<TrimPage ffmpegEngine={mockFfmpegEngine} />);

    const mp4File = new File(["dummy content"], "movie.mp4", {
      type: "video/mp4",
    });

    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    expect(
      screen.queryByText(/In-browser video playback may not be supported for MKV files/i),
    ).not.toBeInTheDocument();
  });
});
