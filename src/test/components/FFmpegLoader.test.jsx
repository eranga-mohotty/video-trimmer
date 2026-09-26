import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FFmpegLoader } from "../../components/FFmpegLoader";

describe("FFmpegLoader component", () => {
  it("renders loader spinner and runtime text", () => {
    render(<FFmpegLoader />);

    expect(
      screen.getByText("Loading FFmpeg.wasm runtime..."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Initializing in-memory WebAssembly engine"),
    ).toBeInTheDocument();
  });
});
