import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExtractAudioPage } from "../../pages/ExtractAudioPage";

describe("ExtractAudioPage component", () => {
  const mockExtractAudio = vi.fn().mockResolvedValue("blob:http://localhost/extracted-audio");
  const mockFfmpegEngine = {
    isLoaded: true,
    isProcessing: false,
    progress: 0,
    processingStage: "",
    logMessage: "",
    extractAudio: mockExtractAudio,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tool header and FilePicker", () => {
    render(<ExtractAudioPage ffmpegEngine={mockFfmpegEngine} />);

    expect(screen.getByText(/Lossless Audio Extraction/i)).toBeInTheDocument();
    expect(screen.getByText("Select Video")).toBeInTheDocument();
  });

  it("defaults to m4a format for MP4 video and allows extraction", async () => {
    render(<ExtractAudioPage ffmpegEngine={mockFfmpegEngine} />);

    const mp4File = new File(["dummy"], "sample.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    const select = screen.getByLabelText(/Output Audio Container/i);
    expect(select.value).toBe("m4a");

    const extractBtn = screen.getByRole("button", { name: /Extract Audio Track/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockExtractAudio).toHaveBeenCalledWith(mp4File, "m4a");
    });
  });

  it("defaults to opus format for WebM video", () => {
    render(<ExtractAudioPage ffmpegEngine={mockFfmpegEngine} />);

    const webmFile = new File(["dummy"], "sample.webm", { type: "video/webm" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [webmFile] } });

    const select = screen.getByLabelText(/Output Audio Container/i);
    expect(select.value).toBe("opus");
  });
});
