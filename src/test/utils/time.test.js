import { describe, it, expect } from "vitest";
import { formatTime, clamp } from "../../utils/time";

describe("time utilities", () => {
  describe("formatTime", () => {
    it("formats 0 seconds correctly", () => {
      expect(formatTime(0)).toBe("0:00.0");
    });

    it("formats single-digit seconds with leading zero", () => {
      expect(formatTime(5)).toBe("0:05.0");
      expect(formatTime(9.9)).toBe("0:09.9");
    });

    it("formats double-digit seconds", () => {
      expect(formatTime(12.3)).toBe("0:12.3");
      expect(formatTime(59.9)).toBe("0:59.9");
    });

    it("formats minutes and seconds", () => {
      expect(formatTime(60)).toBe("1:00.0");
      expect(formatTime(65.4)).toBe("1:05.4");
      expect(formatTime(125.8)).toBe("2:05.8");
    });

    it("formats larger durations exceeding 10 minutes", () => {
      expect(formatTime(725.5)).toBe("12:05.5");
      expect(formatTime(3600)).toBe("60:00.0");
    });

    it("handles boundary and invalid values gracefully", () => {
      expect(formatTime(-10)).toBe("0:00.0");
      expect(formatTime(NaN)).toBe("0:00.0");
      expect(formatTime(null)).toBe("0:00.0");
      expect(formatTime(undefined)).toBe("0:00.0");
    });
  });

  describe("clamp", () => {
    it("returns value if within [min, max]", () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it("clamps to min if value is below min", () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-0.1, 0, 10)).toBe(0);
    });

    it("clamps to max if value is above max", () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(10.1, 0, 10)).toBe(10);
    });

    it("handles identical min and max", () => {
      expect(clamp(5, 5, 5)).toBe(5);
      expect(clamp(2, 5, 5)).toBe(5);
      expect(clamp(8, 5, 5)).toBe(5);
    });
  });
});
