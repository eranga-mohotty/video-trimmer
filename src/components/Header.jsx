export function Header({ onMenuClick, currentRouteName }) {
  return (
    <>
      {/* Top-Left Hamburger Menu Button */}
      <button
        type="button"
        onClick={onMenuClick}
        className="fixed top-4 left-4 z-30 p-2.5 bg-gray-800/80 hover:bg-gray-750 text-gray-200 hover:text-white rounded-xl border border-gray-700 shadow-md backdrop-blur-xs transition-all hover:scale-105 cursor-pointer flex items-center justify-center group"
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
      </button>

      {/* Main Title & Subtitle */}
      <header className="w-full max-w-2xl text-center pt-6 pb-4 px-12 sm:px-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">
          {currentRouteName
            ? `Video Tools: ${currentRouteName}`
            : "Video Trimmer"}
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Fast, private, in-browser video manipulation powered by ffmpeg.wasm
        </p>
      </header>
    </>
  );
}
