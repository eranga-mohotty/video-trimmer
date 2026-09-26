import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TrimmedVideoPreview } from "../../components/TrimmedVideoPreview";

describe("TrimmedVideoPreview component", () => {
  it("returns null when outVideoUrl is null", () => {
    const { container } = render(
      <TrimmedVideoPreview outVideoUrl={null} originalFileName={null} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders video player and download button with original file name prefix", () => {
    render(
      <TrimmedVideoPreview
        outVideoUrl="blob:http://localhost/trimmed-out"
        originalFileName="my_recording.mov"
      />,
    );

    expect(screen.getByText(/Trimmed Video Preview/i)).toBeInTheDocument();

    const link = screen.getByRole("link", {
      name: /Download Trimmed Video/i,
    });
    expect(link).toHaveAttribute("href", "blob:http://localhost/trimmed-out");
    expect(link).toHaveAttribute("download", "trimmed_my_recording.mov");
  });
});
