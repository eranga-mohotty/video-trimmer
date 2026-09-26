import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup DOM after each test
afterEach(() => {
  cleanup();
});

// Mock URL.createObjectURL and URL.revokeObjectURL to avoid jsdom _bytes internal incompatibility
const mockCreateObjectURL = vi.fn(() => "blob:http://localhost/mock-video-url");
const mockRevokeObjectURL = vi.fn();

globalThis.URL.createObjectURL = mockCreateObjectURL;
globalThis.URL.revokeObjectURL = mockRevokeObjectURL;

if (typeof window !== "undefined") {
  window.URL.createObjectURL = mockCreateObjectURL;
  window.URL.revokeObjectURL = mockRevokeObjectURL;

  // Polyfill Element pointer capture in jsdom
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn();
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn();
  }

  // Polyfill HTMLMediaElement methods in jsdom
  if (!window.HTMLMediaElement.prototype.play) {
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
  }
  if (!window.HTMLMediaElement.prototype.pause) {
    window.HTMLMediaElement.prototype.pause = vi.fn();
  }
}
