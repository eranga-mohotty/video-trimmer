import { useState, useEffect, useMemo, useCallback } from "react";
import { FilePicker } from "../components/FilePicker";
import { ProgressBar } from "../components/ProgressBar";
import { OutputPreview } from "../components/OutputPreview";
import { getRecommendedFormatForCodec } from "../utils/audioTracks";

const AUDIO_FORMAT_OPTIONS = [
  { value: "m4a", label: ".m4a (MP4/AAC Audio Container)" },
  { value: "aac", label: ".aac (Raw ADTS AAC Stream)" },
  { value: "eac3", label: ".eac3 (Dolby Digital Plus / E-AC-3)" },
  { value: "ac3", label: ".ac3 (Dolby Digital / AC-3)" },
  { value: "opus", label: ".opus (Opus Audio Container)" },
  { value: "flac", label: ".flac (Lossless FLAC Audio)" },
  { value: "mp3", label: ".mp3 (MPEG Audio Stream)" },
  { value: "wav", label: ".wav (PCM Waveform Audio)" },
  { value: "mka", label: ".mka (Matroska Audio - Universal Lossless Container)" },
];

function detectDefaultAudioFormat(fileName) {
  if (!fileName) return "m4a";
  const lower = fileName.toLowerCase();
  const ext = lower.split(".").slice(-1)[0];

  if (ext === "webm") return "opus";
  if (lower.includes("dd+") || lower.includes("eac3") || lower.includes("ddp")) {
    return "eac3";
  }
  if (lower.includes("ac3") || lower.includes("dd5.1") || lower.includes("dolby")) {
    return "ac3";
  }
  if (lower.includes("flac")) return "flac";
  if (ext === "mkv") return "mka";
  return "m4a";
}

export function ExtractAudioPage({ ffmpegEngine }) {
  const [inputVideo, setInputVideo] = useState(null);
  const [targetFormat, setTargetFormat] = useState("m4a");
  const [audioTracks, setAudioTracks] = useState([]);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [isProbing, setIsProbing] = useState(false);
  const [outAudio, setOutAudio] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    isProcessing,
    progress,
    processingStage,
    logMessage,
    extractAudio,
    probeAudioTracks,
    cleanupVirtualFiles,
  } = ffmpegEngine;

  // Cleanup output audio blob URL when component unmounts or output changes
  useEffect(() => {
    return () => {
      if (outAudio) URL.revokeObjectURL(outAudio);
    };
  }, [outAudio]);

  // Cleanup virtual files in WebAssembly when unmounting
  useEffect(() => {
    return () => {
      if (cleanupVirtualFiles) {
        cleanupVirtualFiles();
      }
    };
  }, [cleanupVirtualFiles]);

  const handleFileSelect = useCallback(
    async (file) => {
      if (outAudio) {
        URL.revokeObjectURL(outAudio);
        setOutAudio(null);
      }
      setErrorMessage("");
      setInputVideo(file);
      setAudioTracks([]);
      setSelectedTrackIndex(0);

      if (!file) return;

      // Initial heuristic format while probing
      setTargetFormat(detectDefaultAudioFormat(file.name));

      // Scan audio tracks
      if (probeAudioTracks) {
        setIsProbing(true);
        try {
          const tracks = await probeAudioTracks(file);
          setAudioTracks(tracks);
          if (tracks && tracks.length > 0) {
            const defaultTrack = tracks.find((t) => t.isDefault) || tracks[0];
            setSelectedTrackIndex(defaultTrack.audioIndex);
            const ext = file.name.split(".").slice(-1)[0];
            const recFormat = getRecommendedFormatForCodec(defaultTrack.codec, ext);
            setTargetFormat(recFormat);
          }
        } catch (probeErr) {
          console.warn("Probe audio tracks error:", probeErr);
        } finally {
          setIsProbing(false);
        }
      }
    },
    [outAudio, probeAudioTracks],
  );

  const handleTrackChange = useCallback(
    (trackIdx) => {
      setSelectedTrackIndex(trackIdx);
      const track = audioTracks.find((t) => t.audioIndex === trackIdx);
      if (track && inputVideo) {
        const ext = inputVideo.name.split(".").slice(-1)[0];
        const recFormat = getRecommendedFormatForCodec(track.codec, ext);
        setTargetFormat(recFormat);
      }
    },
    [audioTracks, inputVideo],
  );

  const handleExtract = useCallback(async () => {
    if (!inputVideo || isProcessing) return;

    setErrorMessage("");
    if (outAudio) {
      URL.revokeObjectURL(outAudio);
      setOutAudio(null);
    }

    try {
      const audioUrl = await extractAudio(
        inputVideo,
        targetFormat,
        selectedTrackIndex,
      );
      setOutAudio(audioUrl);
    } catch (err) {
      setErrorMessage(err.message || "Failed to extract audio.");
    }
  }, [
    inputVideo,
    isProcessing,
    outAudio,
    extractAudio,
    targetFormat,
    selectedTrackIndex,
  ]);

  const outputFileName = useMemo(() => {
    if (!inputVideo) return `extracted_audio.${targetFormat}`;
    const baseName = inputVideo.name.replace(/\.[^/.]+$/, "");
    const track = audioTracks.find((t) => t.audioIndex === selectedTrackIndex);
    const trackTag =
      track?.language ||
      track?.title ||
      (audioTracks.length > 1 ? `track${selectedTrackIndex + 1}` : "");
    const cleanTag = trackTag
      ? `_${trackTag.replace(/[^a-zA-Z0-9_-]/g, "")}`
      : "_audio";
    return `${baseName}${cleanTag}.${targetFormat}`;
  }, [inputVideo, targetFormat, audioTracks, selectedTrackIndex]);

  return (
    <section className="w-full max-w-xl mx-auto flex flex-col items-center">
      {/* Tool Header Card */}
      <div className="w-full text-center mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center justify-center gap-2">
          <span>🎵</span> Lossless Audio Extraction
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Extract original audio tracks directly with zero re-encoding and multi-track selection
        </p>
      </div>

      {/* File Picker */}
      <FilePicker
        selectedFile={inputVideo}
        onFileSelect={handleFileSelect}
        disabled={isProcessing || isProbing}
      />

      {inputVideo && (
        <div className="w-full bg-gray-800/80 p-5 rounded-2xl border border-gray-700 mt-4 shadow-lg flex flex-col gap-4">
          {/* Probing State */}
          {isProbing && (
            <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-950/40 border border-blue-800/50 rounded-xl px-3.5 py-2.5">
              <svg
                className="animate-spin h-4 w-4 text-blue-400 shrink-0"
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
              <span>Scanning audio streams in video...</span>
            </div>
          )}

          {/* Multiple Audio Tracks Selector */}
          {!isProbing && audioTracks.length > 1 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
                  Select Audio Track ({audioTracks.length} available):
                </label>
                <span className="text-[11px] text-blue-400 font-medium bg-blue-950/70 border border-blue-800/50 px-2 py-0.5 rounded-full">
                  Multi-Audio Stream
                </span>
              </div>
              <div className="space-y-2">
                {audioTracks.map((track) => {
                  const isSelected = selectedTrackIndex === track.audioIndex;
                  return (
                    <label
                      key={track.audioIndex}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500/60 text-white shadow-sm"
                          : "bg-gray-900/70 border-gray-700/80 hover:border-gray-600 text-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="audio-track-selection"
                        checked={isSelected}
                        onChange={() => handleTrackChange(track.audioIndex)}
                        disabled={isProcessing}
                        className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm font-semibold truncate">
                            {track.title ||
                              track.languageName ||
                              `Track ${track.audioIndex + 1}`}
                          </span>
                          <span className="text-xs font-mono uppercase bg-gray-800 text-blue-300 border border-gray-700 px-1.5 py-0.5 rounded">
                            {track.codec}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {[
                            track.languageName,
                            track.channels,
                            track.sampleRate,
                            track.bitrate,
                          ]
                            .filter(Boolean)
                            .join(" • ")}
                          {track.isDefault && " (Default)"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Single Audio Track Info */}
          {!isProbing && audioTracks.length === 1 && (
            <div className="flex items-center justify-between p-3 bg-gray-900/70 rounded-xl border border-gray-700/80 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-semibold">Audio Track:</span>
                <span className="text-gray-200">{audioTracks[0].label}</span>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                1 Stream Found
              </span>
            </div>
          )}

          {/* No Audio Tracks Detected Warning */}
          {!isProbing && audioTracks.length === 0 && (
            <div
              role="alert"
              className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl px-3.5 py-2.5 shadow-sm"
            >
              <span className="text-base leading-none">⚠️</span>
              <span>
                No audio streams were detected in this video file.
              </span>
            </div>
          )}

          {/* Format Selector */}
          <div>
            <label
              htmlFor="audio-format-select"
              className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2"
            >
              Output Audio Container:
            </label>
            <select
              id="audio-format-select"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              disabled={isProcessing}
              className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
            >
              {AUDIO_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Lossless Stream Copy Notice */}
          <div className="flex items-start gap-2 text-xs text-blue-300/90 bg-blue-950/40 border border-blue-800/50 rounded-xl px-3.5 py-2.5">
            <svg
              className="w-4 h-4 text-blue-400 shrink-0 mt-0.5"
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
              <strong>Stream Copy (-c:a copy):</strong> Audio frames are extracted directly from the selected stream without CPU re-encoding, preserving 100% original fidelity and finishing in seconds.
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

          {/* Extract Button */}
          <button
            type="button"
            onClick={handleExtract}
            disabled={isProcessing || isProbing || audioTracks.length === 0}
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
                <span>Extracting Audio...</span>
              </>
            ) : (
              <>
                <span>🎵</span>
                <span>
                  {audioTracks.length > 1
                    ? `Extract Track ${selectedTrackIndex + 1}`
                    : "Extract Audio Track"}
                </span>
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

      {/* Audio Output Preview & Download */}
      <OutputPreview
        outUrl={outAudio}
        originalFileName={outputFileName}
        mimeType={`audio/${targetFormat}`}
      />
    </section>
  );
}
