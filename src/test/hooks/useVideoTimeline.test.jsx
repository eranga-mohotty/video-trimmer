import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVideoTimeline } from "../../hooks/useVideoTimeline";

describe("useVideoTimeline", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useVideoTimeline());

    expect(result.current.duration).toBe(0);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.startTime).toBe(0);
    expect(result.current.endTime).toBe(0);
    expect(result.current.draggingHandle).toBeNull();
    expect(result.current.isPreviewPlaying).toBe(false);
  });

  it("handles video loadedmetadata by setting duration and endTime", () => {
    const { result } = renderHook(() => useVideoTimeline());

    act(() => {
      result.current.handleLoadedMetadata({
        currentTarget: { duration: 42.678 },
      });
    });

    expect(result.current.duration).toBe(42.7);
    expect(result.current.startTime).toBe(0);
    expect(result.current.endTime).toBe(42.7);
    expect(result.current.currentTime).toBe(0);
  });

  it("updates start time and clamps within [0, endTime - 0.1]", () => {
    const { result } = renderHook(() => useVideoTimeline());

    act(() => {
      result.current.handleLoadedMetadata({
        currentTarget: { duration: 30 },
      });
    });

    // Update within valid range
    act(() => {
      result.current.updateStartTime(5.5);
    });
    expect(result.current.startTime).toBe(5.5);

    // Attempt to set start time greater than endTime
    act(() => {
      result.current.updateStartTime(35);
    });
    expect(result.current.startTime).toBe(29.9);

    // Attempt to set negative start time
    act(() => {
      result.current.updateStartTime(-5);
    });
    expect(result.current.startTime).toBe(0);
  });

  it("updates end time and clamps within [startTime + 0.1, duration]", () => {
    const { result } = renderHook(() => useVideoTimeline());

    act(() => {
      result.current.handleLoadedMetadata({
        currentTarget: { duration: 30 },
      });
    });

    act(() => {
      result.current.updateStartTime(10);
    });

    // Update within valid range
    act(() => {
      result.current.updateEndTime(20.4);
    });
    expect(result.current.endTime).toBe(20.4);

    // Attempt to set end time beyond total duration
    act(() => {
      result.current.updateEndTime(40);
    });
    expect(result.current.endTime).toBe(30);

    // Attempt to set end time below startTime
    act(() => {
      result.current.updateEndTime(5);
    });
    expect(result.current.endTime).toBe(10.1);
  });

  it("snaps start and end markers to video playhead", () => {
    const { result } = renderHook(() => useVideoTimeline());

    act(() => {
      result.current.handleLoadedMetadata({
        currentTarget: { duration: 60 },
      });
    });

    // Attach mock video element to ref
    result.current.videoRef.current = {
      currentTime: 15.3,
    };

    act(() => {
      result.current.setStartToCurrent();
    });
    expect(result.current.startTime).toBe(15.3);

    result.current.videoRef.current.currentTime = 45.7;
    act(() => {
      result.current.setEndToCurrent();
    });
    expect(result.current.endTime).toBe(45.7);
  });

  it("resets all state back to initial values", () => {
    const { result } = renderHook(() => useVideoTimeline());

    act(() => {
      result.current.handleLoadedMetadata({
        currentTarget: { duration: 50 },
      });
    });

    act(() => {
      result.current.updateEndTime(40);
    });

    act(() => {
      result.current.updateStartTime(10);
    });

    expect(result.current.duration).toBe(50);
    expect(result.current.startTime).toBe(10);
    expect(result.current.endTime).toBe(40);

    act(() => {
      result.current.reset();
    });

    expect(result.current.duration).toBe(0);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.startTime).toBe(0);
    expect(result.current.endTime).toBe(0);
  });

  it("toggles preview playback state", () => {
    const { result } = renderHook(() => useVideoTimeline());
    const mockPlay = vi.fn();
    const mockPause = vi.fn();

    result.current.videoRef.current = {
      currentTime: 0,
      play: mockPlay,
      pause: mockPause,
    };

    act(() => {
      result.current.togglePreviewTrim();
    });

    expect(result.current.isPreviewPlaying).toBe(true);
    expect(mockPlay).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.togglePreviewTrim();
    });

    expect(result.current.isPreviewPlaying).toBe(false);
    expect(mockPause).toHaveBeenCalledTimes(1);
  });
});
