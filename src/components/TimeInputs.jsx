import { formatTime } from "../utils/time";

export function TimeInputs({
  startTime,
  endTime,
  duration,
  disabled,
  isProcessing,
  onStartTimeChange,
  onEndTimeChange,
  onConvert,
}) {
  return (
    <div className="w-full flex flex-col items-center">
      <span className="text-sm text-gray-300 mb-3">
        Adjust markers on the timeline above or enter exact seconds below
      </span>

      {/* Start Input */}
      <div className="flex flex-row ps-5 mb-3 items-center w-full max-w-sm justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <label className="text-sm font-semibold text-gray-200" htmlFor="video_start">
            Start (s):
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="video_start"
            value={startTime}
            min="0"
            max={duration || undefined}
            step="0.1"
            disabled={disabled}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onStartTimeChange(isNaN(val) ? 0 : val);
            }}
            className="shadow appearance-none border border-gray-600 rounded w-28 py-1.5 px-3 text-gray-100 bg-gray-700 leading-tight focus:outline-none focus:border-blue-500 disabled:opacity-50 text-right font-mono"
          />
          <span className="text-xs text-gray-400 w-16 font-mono">
            ({formatTime(startTime)})
          </span>
        </div>
      </div>

      {/* End Input */}
      <div className="flex flex-row ps-5 mb-3 items-center w-full max-w-sm justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500" />
          <label className="pe-3 text-sm font-semibold text-gray-200" htmlFor="video_end">
            End (s):
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            id="video_end"
            value={endTime}
            min="0"
            max={duration || undefined}
            step="0.1"
            disabled={disabled}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onEndTimeChange(isNaN(val) ? duration || 0 : val);
            }}
            className="shadow appearance-none border border-gray-600 rounded w-28 py-1.5 px-3 text-gray-100 bg-gray-700 leading-tight focus:outline-none focus:border-blue-500 disabled:opacity-50 text-right font-mono"
          />
          <span className="text-xs text-gray-400 w-16 font-mono">
            ({formatTime(endTime)})
          </span>
        </div>
      </div>

      {/* Convert / Action Button */}
      <button
        disabled={disabled}
        className={`font-semibold py-2.5 px-8 rounded-lg my-4 flex items-center gap-2 transition-all shadow-md ${
          disabled
            ? "bg-blue-600/40 text-gray-300 cursor-not-allowed border border-blue-400/30"
            : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        }`}
        onClick={onConvert}
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Processing Video...</span>
          </>
        ) : (
          "Convert & Trim Video"
        )}
      </button>
    </div>
  );
}
