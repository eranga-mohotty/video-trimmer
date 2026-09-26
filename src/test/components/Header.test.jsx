import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../../components/Header";

describe("Header component", () => {
  it("renders main title and subtitle", () => {
    render(<Header />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Video Trimmer",
    );
    expect(
      screen.getByText(/Fast, private, in-browser video trimming/i),
    ).toBeInTheDocument();
  });
});
