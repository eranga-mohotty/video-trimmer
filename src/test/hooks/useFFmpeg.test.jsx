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
      audioPromise = result.current.extractAudio(mockFile, "m4a");
    });

    expect(result.current.isProcessing).toBe(true);

    const outUrl = await act(async () => {
      return await audioPromise;
    });

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockExec).toHaveBeenCalledWith(
      expect.arrayContaining(["-vn", "-c:a", "copy"]),
    );
    expect(mockReadFile).toHaveBeenCalledTimes(1);
    expect(mockDeleteFile).toHaveBeenCalledTimes(2);
    expect(outUrl).toBe("blob:http://localhost/mock-video-url");
    expect(result.current.isProcessing).toBe(false);
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
});
