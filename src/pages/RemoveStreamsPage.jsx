export function RemoveStreamsPage() {
  return (
    <section className="w-full max-w-xl mx-auto my-8 p-8 bg-gray-900/80 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-800/40 flex items-center justify-center text-3xl mb-4">
        🔇
      </div>
      <h2 className="text-2xl font-bold text-gray-100">
        Remove Streams &amp; Mute Video
      </h2>
      <p className="text-sm text-gray-400 mt-2 max-w-md">
        Strip unwanted audio tracks or subtitle streams from your video losslessly in seconds without recompressing frames.
      </p>

      <div className="mt-6 p-4 bg-gray-800/60 rounded-xl border border-gray-700/60 w-full text-left">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
          Planned Capabilities:
        </h3>
        <ul className="text-xs text-gray-300 mt-2 space-y-1.5 list-disc list-inside">
          <li>One-click audio strip (<code className="bg-gray-900 px-1 py-0.5 rounded text-purple-300">-an -c:v copy</code>)</li>
          <li>Remove subtitle or data streams (<code className="bg-gray-900 px-1 py-0.5 rounded text-purple-300">-sn</code>)</li>
          <li>Reduce video file size by discarding extraneous channels</li>
        </ul>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-950/80 text-purple-300 border border-purple-800/50">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        Feature Coming Soon
      </div>
    </section>
  );
}
