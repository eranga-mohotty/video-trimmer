import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimelineScrubber } from "../../components/TimelineScrubber";

describe("TimelineScrubber component", () => {
  it("returns null if duration <= 0", () => {
    const { container } = render(
      <TimelineScrubber
        timelineRef={{ current: null }}
        duration={0}
        currentTime={0}
        startTime={0}
        endTime={0}
        disabled={false}
        isPreviewPlaying={false}
        onTrackClick={vi.fn()}
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={vi.fn()}
        onSetStartToCurrent={vi.fn()}
        onSetEndToCurrent={vi.fn()}
        onTogglePreviewTrim={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders timeline info, markers, and quick actions", () => {
    const handleSetStart = vi.fn();
    const handleSetEnd = vi.fn();
    const handleTogglePreview = vi.fn();

    render(
      <TimelineScrubber
        timelineRef={{ current: document.createElement("div") }}
        duration={60}
        currentTime={15}
        startTime={10}
        endTime={40}
        disabled={false}
        isPreviewPlaying={false}
        onTrackClick={vi.fn()}
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={vi.fn()}
        onSetStartToCurrent={handleSetStart}
        onSetEndToCurrent={handleSetEnd}
        onTogglePreviewTrim={handleTogglePreview}
      />,
    );

    expect(screen.getByText("Playhead: 0:15.0")).toBeInTheDocument();
    expect(screen.getByText("Clip: 0:30.0 (30.0s)")).toBeInTheDocument();
    expect(screen.getByText("Total: 1:00.0")).toBeInTheDocument();

    const startBtn = screen.getByRole("button", {
      name: /Set Start to Playhead/i,
    });
    const previewBtn = screen.getByRole("button", {
      name: /Preview Trim/i,
    });
    const endBtn = screen.getByRole("button", {
      name: /Set End to Playhead/i,
    });

    fireEvent.click(startBtn);
    expect(handleSetStart).toHaveBeenCalledTimes(1);

    fireEvent.click(previewBtn);
    expect(handleTogglePreview).toHaveBeenCalledTimes(1);

    fireEvent.click(endBtn);
    expect(handleSetEnd).toHaveBeenCalledTimes(1);
  });

  it("shows 'Pause Preview' when isPreviewPlaying is true", () => {
    render(
      <TimelineScrubber
        timelineRef={{ current: document.createElement("div") }}
        duration={60}
        currentTime={15}
        startTime={10}
        endTime={40}
        disabled={false}
        isPreviewPlaying={true}
        onTrackClick={vi.fn()}
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={vi.fn()}
        onSetStartToCurrent={vi.fn()}
        onSetEndToCurrent={vi.fn()}
        onTogglePreviewTrim={vi.fn()}
      />,
    );

    expect(screen.getByText(/Pause Preview/i)).toBeInTheDocument();
  });
});
