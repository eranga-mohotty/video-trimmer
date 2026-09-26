export function Header({ onMenuClick, currentRouteName }) {
  return (
    <header className="w-full max-w-2xl flex items-center justify-between pt-6 pb-4 px-2">
      {/* Hamburger Menu Toggle Button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="p-2.5 bg-gray-800/80 hover:bg-gray-750 text-gray-200 hover:text-white rounded-xl border border-gray-700 shadow-sm transition-all hover:shadow cursor-pointer flex items-center gap-2 group"
        aria-label="Open navigation menu"
      >
        <svg
          className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
        <span className="hidden sm:inline text-xs font-medium text-gray-400 group-hover:text-gray-200">
          Tools
        </span>
      </button>

      {/* Main Title & Subtitle */}
      <div className="text-center flex-1 mx-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
          {currentRouteName ? `Video Tools: ${currentRouteName}` : "Video Trimmer"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Fast, private, in-browser video manipulation powered by ffmpeg.wasm
        </p>
      </div>

      {/* Placeholder to balance the flex layout */}
      <div className="w-10 sm:w-16" aria-hidden="true" />
    </header>
  );
}
