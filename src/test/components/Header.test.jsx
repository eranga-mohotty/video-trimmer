import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../../components/Header";

describe("Header component", () => {
  it("renders main title, subtitle, and triggers onMenuClick", () => {
    const handleMenuClick = vi.fn();
    render(<Header onMenuClick={handleMenuClick} currentRouteName="Trim Video" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Video Tools: Trim Video",
    );
    expect(
      screen.getByText(/Fast, private, in-browser video manipulation/i),
    ).toBeInTheDocument();

    const menuButton = screen.getByRole("button", { name: /Open navigation menu/i });
    fireEvent.click(menuButton);
    expect(handleMenuClick).toHaveBeenCalledTimes(1);
  });
});
