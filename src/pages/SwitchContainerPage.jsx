export function SwitchContainerPage() {
  return (
    <section className="w-full max-w-xl mx-auto my-8 p-8 bg-gray-900/80 rounded-2xl border border-gray-800 shadow-xl text-center flex flex-col items-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-3xl mb-4">
        🔄
      </div>
      <h2 className="text-2xl font-bold text-gray-100">
        Lossless Container Remuxing
      </h2>
      <p className="text-sm text-gray-400 mt-2 max-w-md">
        Repackage your video into MP4, MKV, MOV, or WebM containers instantly by transferring original codec bitstreams.
      </p>

      <div className="mt-6 p-4 bg-gray-800/60 rounded-xl border border-gray-700/60 w-full text-left">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400">
          Planned Capabilities:
        </h3>
        <ul className="text-xs text-gray-300 mt-2 space-y-1.5 list-disc list-inside">
          <li>Fast container change (<code className="bg-gray-900 px-1 py-0.5 rounded text-amber-300">-c copy</code>)</li>
          <li>Make MKV and FLV recordings compatible with browser and QuickTime players</li>
          <li>No degradation in visual or audio quality</li>
        </ul>
      </div>

      <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-800/50">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        Feature Coming Soon
      </div>
    </section>
  );
}
