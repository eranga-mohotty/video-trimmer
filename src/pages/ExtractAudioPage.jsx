export function ExtractAudioPage() {
  return (
    <section className="w-full max-w-xl mx-auto my-8 p-8 bg-gray-900/80 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-3xl mb-4">
        🎵
      </div>
      <h2 className="text-2xl font-bold text-gray-100">
        Lossless Audio Extraction
      </h2>
      <p className="text-sm text-gray-400 mt-2 max-w-md">
        Extract the original audio track from your video files directly into an AAC or M4A container with zero transcoding or quality loss.
      </p>

      <div className="mt-6 p-4 bg-gray-800/60 rounded-xl border border-gray-700/60 w-full text-left">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400">
          Planned Capabilities:
        </h3>
        <ul className="text-xs text-gray-300 mt-2 space-y-1.5 list-disc list-inside">
          <li>Extract audio stream with <code className="bg-gray-900 px-1 py-0.5 rounded text-blue-300">-c:a copy</code></li>
          <li>Instant processing with zero CPU re-encoding overhead</li>
          <li>In-browser audio waveform and preview playback</li>
        </ul>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-800/50">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
        Feature Coming Soon
      </div>
    </section>
  );
}
