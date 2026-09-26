export function FFmpegLoader() {
  return (
    <div className="flex items-center justify-center w-full h-[70vh] text-gray-100">
      <div className="flex flex-col items-center gap-4">
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          className="animate-spin text-blue-500 h-12 w-12"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span className="text-xl font-medium text-gray-300">
          Loading FFmpeg.wasm runtime...
        </span>
        <span className="text-xs text-gray-500">
          Initializing in-memory WebAssembly engine
        </span>
      </div>
    </div>
  );
}
