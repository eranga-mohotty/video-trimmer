import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SwitchContainerPage } from "../../pages/SwitchContainerPage";

describe("SwitchContainerPage component", () => {
  const mockSwitchContainer = vi.fn().mockResolvedValue("blob:http://localhost/remuxed-video");
  const mockFfmpegEngine = {
    isLoaded: true,
    isProcessing: false,
    progress: 0,
    processingStage: "",
    logMessage: "",
    switchContainer: mockSwitchContainer,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tool header and FilePicker", () => {
    render(<SwitchContainerPage ffmpegEngine={mockFfmpegEngine} />);

    expect(screen.getByText(/Lossless Container Remuxing/i)).toBeInTheDocument();
    expect(screen.getByText("Select Video")).toBeInTheDocument();
  });

  it("filters target containers for MP4 files (shows MKV, MOV, hides WebM)", () => {
    render(<SwitchContainerPage ffmpegEngine={mockFfmpegEngine} />);

    const mp4File = new File(["dummy"], "clip.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    expect(screen.getByText(".MKV")).toBeInTheDocument();
    expect(screen.getByText(".MOV")).toBeInTheDocument();
    expect(screen.queryByText(".WEBM")).not.toBeInTheDocument();
  });

  it("filters target containers for WebM files (shows only MKV)", () => {
    render(<SwitchContainerPage ffmpegEngine={mockFfmpegEngine} />);

    const webmFile = new File(["dummy"], "clip.webm", { type: "video/webm" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [webmFile] } });

    expect(screen.getByText(".MKV")).toBeInTheDocument();
    expect(screen.queryByText(".MP4")).not.toBeInTheDocument();
    expect(screen.queryByText(".MOV")).not.toBeInTheDocument();
  });

  it("triggers switchContainer on remux button click and shows download card", async () => {
    render(<SwitchContainerPage ffmpegEngine={mockFfmpegEngine} />);

    const mp4File = new File(["dummy"], "clip.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    const remuxBtn = screen.getByRole("button", { name: /Switch to \.MKV/i });
    fireEvent.click(remuxBtn);

    await waitFor(() => {
      expect(mockSwitchContainer).toHaveBeenCalledWith(mp4File, "mkv");
      expect(screen.getByText(/Remux Completed Successfully!/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Download \.MKV Video/i })).toBeInTheDocument();
    });
  });
});
