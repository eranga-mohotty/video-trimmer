import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExtractAudioPage } from "../../pages/ExtractAudioPage";

describe("ExtractAudioPage component", () => {
  const mockExtractAudio = vi.fn().mockResolvedValue("blob:http://localhost/extracted-audio");
  const mockProbeAudioTracks = vi.fn().mockResolvedValue([
    {
      streamId: "0:1",
      audioIndex: 0,
      language: "eng",
      languageName: "English",
      title: "Main English",
      codec: "aac",
      channels: "stereo",
      sampleRate: "48000 Hz",
      bitrate: "192 kb/s",
      isDefault: true,
      label: "#1: English (aac, stereo, 48000 Hz)",
    },
  ]);
  const mockCleanupVirtualFiles = vi.fn();

  const mockFfmpegEngine = {
    isLoaded: true,
    isProcessing: false,
    progress: 0,
    processingStage: "",
    logMessage: "",
    extractAudio: mockExtractAudio,
    probeAudioTracks: mockProbeAudioTracks,
    cleanupVirtualFiles: mockCleanupVirtualFiles,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tool header and FilePicker", () => {
    render(<ExtractAudioPage ffmpegEngine={mockFfmpegEngine} />);

    expect(screen.getByText(/Lossless Audio Extraction/i)).toBeInTheDocument();
    expect(screen.getByText("Select Video")).toBeInTheDocument();
  });

  it("probes audio tracks on file selection and allows extraction with default track", async () => {
    render(<ExtractAudioPage ffmpegEngine={mockFfmpegEngine} />);

    const mp4File = new File(["dummy"], "sample.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    await waitFor(() => {
      expect(mockProbeAudioTracks).toHaveBeenCalledWith(mp4File);
    });

    await waitFor(() => {
      expect(screen.getByText(/1 Stream Found/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Output Audio Container/i);
    expect(select.value).toBe("m4a");

    const extractBtn = screen.getByRole("button", { name: /Extract Audio Track/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockExtractAudio).toHaveBeenCalledWith(mp4File, "m4a", 0);
    });
  });

  it("renders multiple audio tracks with radio selection and updates container format on change", async () => {
    const multiTracks = [
      {
        streamId: "0:1",
        audioIndex: 0,
        language: "eng",
        languageName: "English",
        title: "English DD+",
        codec: "eac3",
        channels: "5.1(side)",
        sampleRate: "48000 Hz",
        bitrate: "640 kb/s",
        isDefault: true,
        label: "#1: English (eac3, 5.1(side), 48000 Hz)",
      },
      {
        streamId: "0:2",
        audioIndex: 1,
        language: "jpn",
        languageName: "Japanese",
        title: "Japanese FLAC",
        codec: "flac",
        channels: "stereo",
        sampleRate: "48000 Hz",
        bitrate: null,
        isDefault: false,
        label: "#2: Japanese (flac, stereo, 48000 Hz)",
      },
    ];

    const engineWithMulti = {
      ...mockFfmpegEngine,
      probeAudioTracks: vi.fn().mockResolvedValue(multiTracks),
    };

    render(<ExtractAudioPage ffmpegEngine={engineWithMulti} />);

    const mkvFile = new File(["dummy"], "dual_audio.mkv", { type: "video/x-matroska" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mkvFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Multi-Audio Stream/i)).toBeInTheDocument();
      expect(screen.getByText("English DD+")).toBeInTheDocument();
      expect(screen.getByText("Japanese FLAC")).toBeInTheDocument();
    });

    // Default track was eac3 -> container set to eac3
    const select = screen.getByLabelText(/Output Audio Container/i);
    expect(select.value).toBe("eac3");

    // Select the second track (Japanese FLAC)
    const radioButtons = screen.getAllByRole("radio");
    expect(radioButtons).toHaveLength(2);
    expect(radioButtons[0]).toBeChecked();
    expect(radioButtons[1]).not.toBeChecked();

    fireEvent.click(radioButtons[1]);
    expect(radioButtons[1]).toBeChecked();

    // Recommended format for FLAC is flac
    await waitFor(() => {
      expect(select.value).toBe("flac");
    });

    // Extract button label should show "Extract Track 2"
    const extractBtn = screen.getByRole("button", { name: /Extract Track 2/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(mockExtractAudio).toHaveBeenCalledWith(mkvFile, "flac", 1);
    });
  });

  it("displays warning and disables extract button when no audio streams are found", async () => {
    const engineWithNoAudio = {
      ...mockFfmpegEngine,
      probeAudioTracks: vi.fn().mockResolvedValue([]),
    };

    render(<ExtractAudioPage ffmpegEngine={engineWithNoAudio} />);

    const silentFile = new File(["dummy"], "silent.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [silentFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/No audio streams were detected in this video file/i),
      ).toBeInTheDocument();
    });

    const extractBtn = screen.getByRole("button", { name: /Extract Audio Track/i });
    expect(extractBtn).toBeDisabled();
  });

  it("handles extraction errors and displays error message", async () => {
    const engineWithError = {
      ...mockFfmpegEngine,
      extractAudio: vi.fn().mockRejectedValue(new Error("Demuxing failed: invalid stream")),
    };

    render(<ExtractAudioPage ffmpegEngine={engineWithError} />);

    const mp4File = new File(["dummy"], "sample.mp4", { type: "video/mp4" });
    const fileInput = document.querySelector('input[type="file"]');
    fireEvent.change(fileInput, { target: { files: [mp4File] } });

    await waitFor(() => {
      expect(screen.getByText(/1 Stream Found/i)).toBeInTheDocument();
    });

    const extractBtn = screen.getByRole("button", { name: /Extract Audio Track/i });
    fireEvent.click(extractBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Demuxing failed: invalid stream/i),
      ).toBeInTheDocument();
    });
  });
});

