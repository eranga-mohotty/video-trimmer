import { useState, useEffect, useMemo, useCallback } from "react";
import { FilePicker } from "../components/FilePicker";
import { VideoPlayer } from "../components/VideoPlayer";
import { ProgressBar } from "../components/ProgressBar";
import { OutputPreview } from "../components/OutputPreview";

export function RemoveStreamsPage({ ffmpegEngine }) {
  const [inputVideo, setInputVideo] = useState(null);
  const [outVideo, setOutVideo] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Stream removal options
  const [removeAudio, setRemoveAudio] = useState(true);
  const [removeSubtitles, setRemoveSubtitles] = useState(false);
  const [removeMetadata, setRemoveMetadata] = useState(false);

  const {
    isProcessing,
    progress,
    processingStage,
    logMessage,
    removeStreams,
  } = ffmpegEngine;

  // Stable input video blob URL with automatic cleanup
  const inputVideoUrl = useMemo(() => {
    if (!inputVideo) return null;
    return URL.createObjectURL(inputVideo);
  }, [inputVideo]);

  useEffect(() => {
    return () => {
      if (inputVideoUrl) URL.revokeObjectURL(inputVideoUrl);
    };
  }, [inputVideoUrl]);

  // Cleanup output video blob URL
  useEffect(() => {
    return () => {
      if (outVideo) URL.revokeObjectURL(outVideo);
    };
  }, [outVideo]);

  const handleFileSelect = useCallback(
    (file) => {
      if (outVideo) {
        URL.revokeObjectURL(outVideo);
        setOutVideo(null);
      }
      setErrorMessage("");
      setInputVideo(file);
    },
    [outVideo],
  );

  const isAnyStreamSelected = removeAudio || removeSubtitles || removeMetadata;

  const handleProcess = useCallback(async () => {
    if (!inputVideo || isProcessing || !isAnyStreamSelected) return;

    setErrorMessage("");
    if (outVideo) {
      URL.revokeObjectURL(outVideo);
      setOutVideo(null);
    }

    try {
      const processedUrl = await removeStreams(inputVideo, {
        removeAudio,
        removeSubtitles,
        removeMetadata,
      });
      setOutVideo(processedUrl);
    } catch (err) {
      setErrorMessage(err.message || "Failed to remove streams.");
    }
  }, [
    inputVideo,
    isProcessing,
    isAnyStreamSelected,
    outVideo,
    removeStreams,
    removeAudio,
    removeSubtitles,
    removeMetadata,
  ]);

  const outputFileName = useMemo(() => {
    if (!inputVideo) return "processed_video.mp4";
    const parts = inputVideo.name.split(".");
    const ext = parts.pop();
    const base = parts.join(".");
    const tags = [];
    if (removeAudio) tags.push("muted");
    if (removeSubtitles) tags.push("nosub");
    if (removeMetadata) tags.push("clean");
    const tagSuffix = tags.length > 0 ? `_${tags.join("_")}` : "_clean";
    return `${base}${tagSuffix}.${ext}`;
  }, [inputVideo, removeAudio, removeSubtitles, removeMetadata]);

  return (
    <section className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Tool Header Card */}
      <div className="w-full text-center mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center justify-center gap-2">
          <span>🔇</span> Remove Streams &amp; Mute Video
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Losslessly drop audio tracks, subtitles, or metadata without re-encoding video frames
        </p>
      </div>

      {/* Input Video Player Preview */}
      <VideoPlayer videoUrl={inputVideoUrl} />

      {/* File Picker */}
      <FilePicker
        selectedFile={inputVideo}
        onFileSelect={handleFileSelect}
        disabled={isProcessing}
      />

      {inputVideo && (
        <div className="w-full bg-gray-800/80 p-5 rounded-2xl border border-gray-700 mt-4 shadow-lg flex flex-col gap-4">
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            Select Streams to Strip:
          </span>

          <div className="space-y-3">
            {/* Remove Audio Checkbox */}
            <label className="flex items-center gap-3 p-3 bg-gray-900/80 rounded-xl border border-gray-700/80 hover:border-gray-600 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={removeAudio}
                onChange={(e) => setRemoveAudio(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-200 block">
                  Remove Audio (Mute Video)
                </span>
                <span className="text-xs text-gray-400">
                  Strips all sound tracks (<code className="text-blue-300">-an</code>), keeping video bitstream 100% intact.
                </span>
              </div>
            </label>

            {/* Remove Subtitles Checkbox */}
            <label className="flex items-center gap-3 p-3 bg-gray-900/80 rounded-xl border border-gray-700/80 hover:border-gray-600 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={removeSubtitles}
                onChange={(e) => setRemoveSubtitles(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-200 block">
                  Remove Subtitles
                </span>
                <span className="text-xs text-gray-400">
                  Drops embedded subtitle and text streams (<code className="text-blue-300">-sn</code>).
                </span>
              </div>
            </label>

            {/* Remove Metadata Checkbox */}
            <label className="flex items-center gap-3 p-3 bg-gray-900/80 rounded-xl border border-gray-700/80 hover:border-gray-600 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={removeMetadata}
                onChange={(e) => setRemoveMetadata(e.target.checked)}
                disabled={isProcessing}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
              />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-gray-200 block">
                  Remove Metadata &amp; Data Streams
                </span>
                <span className="text-xs text-gray-400">
                  Strips metadata tags, GPS data, and auxiliary data tracks (<code className="text-blue-300">-dn</code>).
                </span>
              </div>
            </label>
          </div>

          {!isAnyStreamSelected && (
            <p className="text-xs text-amber-400 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2.5">
              ⚠️ Please select at least one stream removal option above to proceed.
            </p>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 text-xs text-red-300 bg-red-950/40 border border-red-800/60 rounded-xl px-3.5 py-2.5 shadow-sm"
            >
              <span className="text-base leading-none">❌</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Process Button */}
          <button
            type="button"
            onClick={handleProcess}
            disabled={isProcessing || !isAnyStreamSelected}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
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
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                <span>Processing Streams...</span>
              </>
            ) : (
              <>
                <span>🔇</span>
                <span>Strip Selected Streams</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Bar */}
      <ProgressBar
        isProcessing={isProcessing}
        progress={progress}
        stage={processingStage}
        logMessage={logMessage}
      />

      {/* Video Output Preview & Download */}
      <OutputPreview
        outUrl={outVideo}
        originalFileName={outputFileName}
      />
    </section>
  );
}
