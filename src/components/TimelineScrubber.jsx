import { formatTime } from "../utils/time";

export function TimelineScrubber({
  timelineRef,
  duration,
  currentTime,
  startTime,
  endTime,
  disabled,
  isPreviewPlaying,
  onTrackClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onSetStartToCurrent,
  onSetEndToCurrent,
  onTogglePreviewTrim,
}) {
  if (duration <= 0) return null;

  const startPercent = (startTime / duration) * 100;
  const endPercent = (endTime / duration) * 100;
  const currentPercent = (currentTime / duration) * 100;
  const clipDuration = Math.max(0, endTime - startTime);

  return (
    <div className="w-full max-w-xl mx-auto my-4 p-4 bg-gray-900/90 rounded-xl border border-gray-700 shadow-xl">
      {/* Header Info */}
      <div className="flex justify-between items-center text-xs text-gray-400 mb-2 font-mono">
        <span>Playhead: {formatTime(currentTime)}</span>
        <span className="text-blue-400 font-semibold">
          Clip: {formatTime(clipDuration)} ({clipDuration.toFixed(1)}s)
        </span>
        <span>Total: {formatTime(duration)}</span>
      </div>

      {/* Scrubber / Marker Track */}
      <div
        ref={timelineRef}
        className="relative w-full h-10 flex items-center select-none cursor-pointer group"
        onClick={onTrackClick}
      >
        {/* Background Track */}
        <div className="w-full h-3 bg-gray-800 rounded-full border border-gray-700 overflow-hidden relative">
          {/* Selected Trim Highlight */}
          <div
            className="absolute top-0 bottom-0 bg-blue-500/40 border-y border-blue-400 pointer-events-none transition-all duration-75"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(0, endPercent - startPercent)}%`,
            }}
          />
        </div>

        {/* Playhead Indicator */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-10 transition-all duration-75"
          style={{ left: `${currentPercent}%` }}
        >
          <div className="w-0.5 h-full bg-white shadow-md mx-auto" />
          <div className="w-2.5 h-2.5 bg-white rounded-full -translate-x-1/2 -translate-y-full shadow-md" />
        </div>

        {/* Start Marker Handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-20 touch-none select-none flex flex-col items-center ${
            disabled
              ? "opacity-50 pointer-events-none"
              : "cursor-grab active:cursor-grabbing"
          }`}
          style={{
            left: `${startPercent}%`,
            transform: "translate(-50%, -50%)",
          }}
          onPointerDown={(e) => onPointerDown("start", e)}
          onPointerMove={(e) => onPointerMove("start", e)}
          onPointerUp={onPointerUp}
        >
          <div className="bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-emerald-300 flex items-center gap-0.5">
            <span>[</span>
            <span className="font-mono">{formatTime(startTime)}</span>
          </div>
          <div className="w-1 h-3 bg-emerald-500 rounded-b" />
        </div>

        {/* End Marker Handle */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 z-20 touch-none select-none flex flex-col items-center ${
            disabled
              ? "opacity-50 pointer-events-none"
              : "cursor-grab active:cursor-grabbing"
          }`}
          style={{ left: `${endPercent}%`, transform: "translate(-50%, -50%)" }}
          onPointerDown={(e) => onPointerDown("end", e)}
          onPointerMove={(e) => onPointerMove("end", e)}
          onPointerUp={onPointerUp}
        >
          <div className="bg-rose-500 hover:bg-rose-400 text-white text-[11px] font-bold px-1.5 py-0.5 rounded shadow-lg border border-rose-300 flex items-center gap-0.5">
            <span className="font-mono">{formatTime(endTime)}</span>
            <span>]</span>
          </div>
          <div className="w-1 h-3 bg-rose-500 rounded-b" />
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-gray-800 text-xs">
        <button
          type="button"
          disabled={disabled}
          onClick={onSetStartToCurrent}
          className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/60 rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          <span>[</span> Set Start to Playhead
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onTogglePreviewTrim}
          className={`px-3 py-1 font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
            isPreviewPlaying
              ? "bg-amber-600 hover:bg-amber-500 text-white"
              : "bg-blue-600 hover:bg-blue-500 text-white"
          }`}
        >
          {isPreviewPlaying ? "⏸ Pause Preview" : "▶ Preview Trim"}
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onSetEndToCurrent}
          className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-800 text-rose-300 border border-rose-700/60 rounded transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1"
        >
          Set End to Playhead <span>]</span>
        </button>
      </div>
    </div>
  );
}
