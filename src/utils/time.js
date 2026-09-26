/**
 * Pure utility functions for time formatting and numerical clamping.
 */

/**
 * Formats a duration in seconds into MM:SS.s string format.
 * @param {number} secs - Time in seconds.
 * @returns {string} Formatted time string (e.g., "1:23.4").
 */
export function formatTime(secs) {
  if (isNaN(secs) || secs === undefined || secs === null || secs < 0) {
    return "0:00.0";
  }
  const totalDeciseconds = Math.round(secs * 10);
  const totalSeconds = Math.floor(totalDeciseconds / 10);
  const tenths = totalDeciseconds % 10;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}.${tenths}`;
}

/**
 * Clamps a number between min and max bounds.
 * @param {number} val - Value to clamp.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} Clamped value.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
