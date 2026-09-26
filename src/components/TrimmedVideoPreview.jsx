export function TrimmedVideoPreview({ outVideoUrl, originalFileName }) {
  if (!outVideoUrl) return null;

  const downloadName = originalFileName
    ? `trimmed_${originalFileName}`
    : "trimmed_video.mp4";

  return (
    <div className="flex flex-col items-center my-6 p-4 bg-gray-900/60 rounded-2xl border border-gray-700 shadow-xl max-w-xl w-full">
      <h2 className="text-xl font-bold mb-3 text-gray-100 flex items-center gap-2">
        <span className="text-green-400">✓</span> Trimmed Video Preview
      </h2>
      <video
        className="max-w-full rounded-xl shadow-lg border border-gray-700 bg-black"
        controls
        src={outVideoUrl}
      />
      <a
        href={outVideoUrl}
        download={downloadName}
        className="mt-4 bg-green-600 hover:bg-green-500 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
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
        Download Trimmed Video
      </a>
    </div>
  );
}
