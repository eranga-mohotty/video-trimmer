import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { VideoPlayer } from "../../components/VideoPlayer";

describe("VideoPlayer component", () => {
  it("returns null when videoUrl is null", () => {
    const { container } = render(
      <VideoPlayer
        videoRef={{ current: null }}
        videoUrl={null}
        onLoadedMetadata={vi.fn()}
        onTimeUpdate={vi.fn()}
        onPause={vi.fn()}
        onEnded={vi.fn()}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders video element with given src and controls", () => {
    const { container } = render(
      <VideoPlayer
        videoRef={{ current: null }}
        videoUrl="blob:http://localhost/sample-video"
        onLoadedMetadata={vi.fn()}
        onTimeUpdate={vi.fn()}
        onPause={vi.fn()}
        onEnded={vi.fn()}
      />,
    );

    const video = container.querySelector("video");
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute("src", "blob:http://localhost/sample-video");
    expect(video).toHaveAttribute("controls");
  });
});
