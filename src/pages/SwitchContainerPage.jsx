import { useState, useEffect, useMemo, useCallback } from "react";
import { FilePicker } from "../components/FilePicker";
import { ProgressBar } from "../components/ProgressBar";

const ALL_CONTAINER_DEFS = [
  { id: "mp4", label: "MP4", desc: "Universal web and mobile container (MPEG-4 Part 14)" },
  { id: "mkv", label: "MKV", desc: "Universal Matroska container supporting virtually all codecs" },
  { id: "webm", label: "WebM", desc: "Open web media format for VP8, VP9, and AV1 bitstreams" },
  { id: "mov", label: "MOV", desc: "Apple QuickTime container format" },
];

function getAvailableContainers(inputExt) {
  if (!inputExt) return ALL_CONTAINER_DEFS;
  const clean = inputExt.toLowerCase();

  if (clean === "mp4" || clean === "m4v") {
    // MP4 codecs (H.264/H.265/AAC) can go into MKV and MOV losslessly
    return ALL_CONTAINER_DEFS.filter((c) => ["mkv", "mov"].includes(c.id));
  }
  if (clean === "mov") {
    return ALL_CONTAINER_DEFS.filter((c) => ["mp4", "mkv"].includes(c.id));
  }
  if (clean === "webm") {
    // WebM codecs (VP8/VP9/Opus) remux losslessly into MKV
    return ALL_CONTAINER_DEFS.filter((c) => ["mkv"].includes(c.id));
  }
  if (clean === "mkv") {
    // MKV can attempt remux to MP4, MOV, or WebM
    return ALL_CONTAINER_DEFS.filter((c) => ["mp4", "mov", "webm"].includes(c.id));
  }

  return ALL_CONTAINER_DEFS.filter((c) => c.id !== clean);
}

export function SwitchContainerPage({ ffmpegEngine }) {
  const [inputVideo, setInputVideo] = useState(null);
  const [targetContainer, setTargetContainer] = useState("mkv");
  const [outVideoUrl, setOutVideoUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    isProcessing,
    progress,
    processingStage,
    logMessage,
    switchContainer,
  } = ffmpegEngine;

  // Cleanup output blob URL
  useEffect(() => {
    return () => {
      if (outVideoUrl) URL.revokeObjectURL(outVideoUrl);
    };
  }, [outVideoUrl]);

  const inputExt = useMemo(() => {
    if (!inputVideo) return "";
    return inputVideo.name.split(".").slice(-1)[0].toLowerCase();
  }, [inputVideo]);

  const availableContainers = useMemo(() => {
    return getAvailableContainers(inputExt);
  }, [inputExt]);

  const handleFileSelect = useCallback(
    (file) => {
      if (outVideoUrl) {
        URL.revokeObjectURL(outVideoUrl);
        setOutVideoUrl(null);
      }
      setErrorMessage("");
      setInputVideo(file);

      if (file) {
        const ext = file.name.split(".").slice(-1)[0].toLowerCase();
        const available = getAvailableContainers(ext);
        if (available.length > 0) {
          setTargetContainer(available[0].id);
        }
      }
    },
    [outVideoUrl],
  );

  const handleRemux = useCallback(async () => {
    if (!inputVideo || isProcessing) return;

    setErrorMessage("");
    if (outVideoUrl) {
      URL.revokeObjectURL(outVideoUrl);
      setOutVideoUrl(null);
    }

    try {
      const resultUrl = await switchContainer(inputVideo, targetContainer);
      setOutVideoUrl(resultUrl);
    } catch (err) {
      setErrorMessage(err.message || "Failed to remux video container.");
    }
  }, [inputVideo, isProcessing, outVideoUrl, switchContainer, targetContainer]);

  const outputFileName = useMemo(() => {
    if (!inputVideo) return `converted_video.${targetContainer}`;
    const baseName = inputVideo.name.replace(/\.[^/.]+$/, "");
    return `${baseName}.${targetContainer}`;
  }, [inputVideo, targetContainer]);

  return (
    <section className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Tool Header Card */}
      <div className="w-full text-center mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center justify-center gap-2">
          <span>🔄</span> Lossless Container Remuxing
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Repackage bitstreams into different container formats instantly with zero re-encoding
        </p>
      </div>

      {/* File Picker */}
      <FilePicker
        selectedFile={inputVideo}
        onFileSelect={handleFileSelect}
        disabled={isProcessing}
      />

      {inputVideo && (
        <div className="w-full bg-gray-800/80 p-5 rounded-2xl border border-gray-700 mt-4 shadow-lg flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Select Target Container:
              </span>
              <span className="text-[11px] text-gray-400">
                Source: <span className="text-blue-400 font-mono uppercase">.{inputExt}</span>
              </span>
            </div>

            {/* Smart Container Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availableContainers.map((c) => {
                const isSelected = targetContainer === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTargetContainer(c.id)}
                    disabled={isProcessing}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-600/20 border-amber-500/60 text-white shadow-sm"
                        : "bg-gray-900/70 border-gray-700/80 hover:border-gray-600 text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm tracking-wide">
                        .{c.id.toUpperCase()}
                      </span>
                      {isSelected && (
                        <span className="text-amber-400 text-xs">● Selected</span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                      {c.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lossless Stream Copy Notice */}
          <div className="flex items-start gap-2 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/50 rounded-xl px-3.5 py-2.5">
            <svg
              className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Stream Copy (-c copy):</strong> Container remuxing transfers raw video/audio frames into the new container envelope without decompression, completing in seconds.
            </span>
          </div>

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

          {/* Remux Button */}
          <button
            type="button"
            onClick={handleRemux}
            disabled={isProcessing || availableContainers.length === 0}
            className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                <span>Remuxing Video...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Switch to .{targetContainer.toUpperCase()}</span>
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

      {/* Direct Download Card (No Video Player Preview) */}
      {outVideoUrl && (
        <div className="flex flex-col items-center my-6 p-5 bg-gray-900/80 rounded-2xl border border-gray-700 shadow-xl max-w-xl w-full">
          <div className="w-12 h-12 rounded-xl bg-green-950/70 border border-green-700/60 flex items-center justify-center text-green-400 text-2xl mb-2">
            ✓
          </div>
          <h3 className="text-lg font-bold text-gray-100">
            Remux Completed Successfully!
          </h3>
          <p className="text-xs text-gray-400 mt-1 text-center">
            New container format: <span className="font-semibold text-amber-300">.{targetContainer.toUpperCase()}</span>
          </p>

          <a
            href={outVideoUrl}
            download={outputFileName}
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
            <span>Download .{targetContainer.toUpperCase()} Video</span>
          </a>
        </div>
      )}
    </section>
  );
}
