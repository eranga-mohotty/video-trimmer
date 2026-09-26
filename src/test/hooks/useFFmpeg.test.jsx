import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock handlers to simulate ffmpeg events
let mockListeners = {};
const mockExec = vi.fn().mockResolvedValue(0);
const mockWriteFile = vi.fn().mockResolvedValue(true);
const mockReadFile = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]));
const mockDeleteFile = vi.fn().mockResolvedValue(true);
const mockLoad = vi.fn().mockResolvedValue(true);

vi.mock("@ffmpeg/ffmpeg", () => {
  class MockFFmpeg {
    constructor() {
      this.load = mockLoad;
      this.on = vi.fn((event, callback) => {
        mockListeners[event] = callback;
      });
      this.off = vi.fn((event) => {
        delete mockListeners[event];
      });
      this.writeFile = mockWriteFile;
      this.readFile = mockReadFile;
      this.deleteFile = mockDeleteFile;
      this.exec = mockExec;
    }
  }

  return {
    FFmpeg: MockFFmpeg,
  };
});

vi.mock("@ffmpeg/util", () => ({
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([10, 20, 30])),
}));

// Import after mocking
import { useFFmpeg } from "../../hooks/useFFmpeg";

describe("useFFmpeg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListeners = {};
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:http://localhost/mock-video-url"),
      revokeObjectURL: vi.fn(),
    });
  });

  it("initializes and calls load() on mount", async () => {
    const { result } = renderHook(() => useFFmpeg());

    expect(mockLoad).toHaveBeenCalledTimes(1);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.isLoaded).toBe(true);
  });

  it("updates log message on ffmpeg log event", async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      if (mockListeners["log"]) {
        mockListeners["log"]({ message: "FFmpeg initialized successfully" });
      }
    });

    expect(result.current.logMessage).toBe("FFmpeg initialized successfully");
  });

  it("updates progress and stage on ffmpeg progress event", async () => {
    const { result } = renderHook(() => useFFmpeg());

    await act(async () => {
      if (mockListeners["progress"]) {
        mockListeners["progress"]({ progress: 0.45 });
      }
    });

    expect(result.current.progress).toBe(45);
    expect(result.current.processingStage).toBe("Processing... 45%");
  });

  it("executes trimVideo workflow with correct arguments and cleans up", async () => {
    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "test.mp4", {
      type: "video/mp4",
    });

    let trimPromise;
    act(() => {
      trimPromise = result.current.trimVideo(mockFile, 5, 15);
    });

    expect(result.current.isProcessing).toBe(true);

    const outUrl = await act(async () => {
      return await trimPromise;
    });

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockExec).toHaveBeenCalledWith(
      expect.arrayContaining(["-ss", "5", "-to", "15", "-c", "copy"]),
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteFile).toHaveBeenCalledTimes(2); // In and out files
    expect(outUrl).toBe("blob:http://localhost/mock-video-url");
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(100);
  });

  it("executes extractAudio with correct flags (-vn -c:a copy)", async () => {
    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "clip.mp4", {
      type: "video/mp4",
    });

    let audioPromise;
    act(() => {
      audioPromise = result.current.extractAudio(mockFile, "m4a", 1);
    });

    expect(result.current.isProcessing).toBe(true);

    const outUrl = await act(async () => {
      return await audioPromise;
    });

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockExec).toHaveBeenCalledWith(
      expect.arrayContaining(["-map", "0:a:1", "-vn", "-c:a", "copy"]),
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteFile).toHaveBeenCalled();
    expect(outUrl).toBe("blob:http://localhost/mock-video-url");
    expect(result.current.isProcessing).toBe(false);
  });

  it("probes audio tracks from media file logs", async () => {
    mockExec.mockImplementationOnce(async () => {
      if (mockListeners["log"]) {
        mockListeners["log"]({
          message:
            "Stream #0:1(eng): Audio: eac3, 48000 Hz, 5.1(side), 640 kb/s (default)",
        });
        mockListeners["log"]({
          message:
            "Stream #0:2(jpn): Audio: eac3, 48000 Hz, 5.1(side), 640 kb/s",
        });
      }
      return 1; // expected for header probe
    });

    const { result } = renderHook(() => useFFmpeg());
    const mockFile = new File(["dummy video"], "dual.mkv", {
      type: "video/x-matroska",
    });

    let tracks;
    await act(async () => {
      tracks = await result.current.probeAudioTracks(mockFile);
    });

    expect(tracks).toHaveLength(2);
    expect(tracks[0].language).toBe("eng");
    expect(tracks[0].audioIndex).toBe(0);
    expect(tracks[1].language).toBe("jpn");
    expect(tracks[1].audioIndex).toBe(1);
  });

  it("executes removeStreams with chosen options (-an, -sn, -dn)", async () => {
    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "clip.mp4", {
      type: "video/mp4",
    });

    let streamPromise;
    act(() => {
      streamPromise = result.current.removeStreams(mockFile, {
        removeAudio: true,
        removeSubtitles: true,
        removeMetadata: true,
      });
    });

    const outUrl = await act(async () => {
      return await streamPromise;
    });

    expect(mockExec).toHaveBeenCalledWith(
      expect.arrayContaining(["-c:v", "copy", "-an", "-sn", "-dn"]),
    );
    expect(outUrl).toBe("blob:http://localhost/mock-video-url");
  });

  it("executes switchContainer with target format", async () => {
    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "clip.mp4", {
      type: "video/mp4",
    });

    let remuxPromise;
    act(() => {
      remuxPromise = result.current.switchContainer(mockFile, "mkv");
    });

    const outUrl = await act(async () => {
      return await remuxPromise;
    });

    expect(mockExec).toHaveBeenCalledWith(
      expect.arrayContaining(["-c", "copy"]),
    );
    expect(outUrl).toBe("blob:http://localhost/mock-video-url");
  });

  it("handles errors during trimVideo gracefully", async () => {
    mockExec.mockRejectedValueOnce(new Error("FFmpeg execution crashed"));
    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "test.mp4", {
      type: "video/mp4",
    });

    let caughtError = null;
    await act(async () => {
      try {
        await result.current.trimVideo(mockFile, 2, 8);
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe("FFmpeg execution crashed");
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processingStage).toBe("Trimming failed");
  });

  it("throws error when FFmpeg returns non-zero exit code during extractAudio", async () => {
    mockExec.mockResolvedValueOnce(1); // non-zero exit code
    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "clip.mp4", {
      type: "video/mp4",
    });

    let caughtError = null;
    await act(async () => {
      try {
        await result.current.extractAudio(mockFile, "aac");
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeDefined();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.processingStage).toBe("Extraction failed");
  });

  it("throws friendly error detecting source codec when output file is empty", async () => {
    mockReadFile.mockResolvedValueOnce(new Uint8Array([])); // 0 bytes file
    mockExec.mockImplementationOnce(async () => {
      // Simulate FFmpeg logging stream info during execution
      if (mockListeners["log"]) {
        mockListeners["log"]({
          message: "Stream #0:1(eng): Audio: eac3, 48000 Hz, 5.1(side)",
        });
      }
      return 0;
    });

    const { result } = renderHook(() => useFFmpeg());

    const mockFile = new File(["dummy video"], "clip.mkv", {
      type: "video/x-matroska",
    });

    let caughtError = null;
    await act(async () => {
      try {
        await result.current.extractAudio(mockFile, "aac");
      } catch (err) {
        caughtError = err;
      }
    });

    expect(caughtError).toBeDefined();
    expect(caughtError.message).toContain("EAC3");
    expect(caughtError.message).toContain(".eac3");
  });
});
