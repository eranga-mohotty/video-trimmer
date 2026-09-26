export function OutputPreview({ outUrl, originalFileName, mimeType }) {
  if (!outUrl) return null;

  const isAudio =
    mimeType?.startsWith("audio") ||
    /\.(aac|mp3|m4a|wav|opus|ogg|eac3|ac3|flac|mka)$/i.test(
      originalFileName || "",
    );

  const downloadName = originalFileName
    ? `trimmed_${originalFileName}`
    : isAudio
      ? "extracted_audio.aac"
      : "trimmed_video.mp4";

  const isUnsupportedInBrowserAudio = /\.(eac3|ac3|mka)$/i.test(
    originalFileName || "",
  );

  return (
    <div className="flex flex-col items-center my-6 p-5 bg-gray-900/70 rounded-2xl border border-gray-700 shadow-xl max-w-xl w-full">
      <h2 className="text-xl font-bold mb-3 text-gray-100 flex items-center gap-2">
        <span className="text-green-400">✓</span>
        {isAudio ? "Extracted Audio Preview" : "Trimmed Video Preview"}
      </h2>

      {isAudio ? (
        <>
          <audio controls className="w-full my-2" src={outUrl} />
          {isUnsupportedInBrowserAudio && (
            <p className="text-[11px] text-gray-400 mt-1 text-center bg-gray-800/60 rounded-lg p-2 border border-gray-700/50">
              Notice: In-browser audio playback for Dolby Digital (AC3/E-AC3) or MKA depends on your browser&apos;s codec support. The downloaded file can be played in VLC or any media player.
            </p>
          )}
        </>
      ) : (
        <video
          className="max-w-full rounded-xl shadow-lg border border-gray-700 bg-black"
          controls
          src={outUrl}
        />
      )}

      <a
        href={outUrl}
        download={downloadName}
        className="mt-4 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isAudio ? "Download Audio Track" : "Download Trimmed Video"}
      </a>
    </div>
  );
}

// Backward-compatible alias for existing consumers
export function TrimmedVideoPreview({ outVideoUrl, originalFileName }) {
  return <OutputPreview outUrl={outVideoUrl} originalFileName={originalFileName} />;
}
