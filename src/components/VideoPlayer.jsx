export function VideoPlayer({
  videoRef,
  videoUrl,
  onLoadedMetadata,
  onTimeUpdate,
  onPause,
  onEnded,
}) {
  if (!videoUrl) return null;

  return (
    <div className="w-full flex justify-center p-2">
      <video
        ref={videoRef}
        id="input_video"
        controls
        className="max-w-full max-h-[55vh] rounded-xl shadow-2xl border border-gray-700 bg-black"
        src={videoUrl}
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onPause={onPause}
        onEnded={onEnded}
      />
    </div>
  );
}
