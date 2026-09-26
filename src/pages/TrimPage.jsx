import { useState, useEffect, useMemo, useCallback } from "react";

// Custom Hook for Timeline & Playback
import { useVideoTimeline } from "../hooks/useVideoTimeline";

// Presentational Components
import { FilePicker } from "../components/FilePicker";
import { VideoPlayer } from "../components/VideoPlayer";
import { TimelineScrubber } from "../components/TimelineScrubber";
import { TimeInputs } from "../components/TimeInputs";
import { ProgressBar } from "../components/ProgressBar";
import { OutputPreview } from "../components/OutputPreview";

export function TrimPage({ ffmpegEngine }) {
  const [inputVideo, setInputVideo] = useState(null);
  const [outVideo, setOutVideo] = useState(null);

  const {
    isProcessing,
    progress,
    processingStage,
    logMessage,
    trimVideo,
  } = ffmpegEngine;

  const {
    videoRef,
    timelineRef,
    duration,
    currentTime,
    startTime,
    endTime,
    isPreviewPlaying,
    setIsPreviewPlaying,
    reset: resetTimeline,
    handleLoadedMetadata,
    handleTimeUpdate,
    updateStartTime,
    updateEndTime,
    handleTrackClick,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    setStartToCurrent,
    setEndToCurrent,
    togglePreviewTrim,
  } = useVideoTimeline();

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

  // Handle new video file selection
  const handleFileSelect = useCallback(
    (file) => {
      if (outVideo) {
        URL.revokeObjectURL(outVideo);
        setOutVideo(null);
      }
      setInputVideo(file);
      resetTimeline();
    },
    [outVideo, resetTimeline],
  );

  // Validate inputs and trigger trim operation
  const handleConvert = useCallback(async () => {
    if (isProcessing || !inputVideo) return;

    if (isNaN(startTime) || startTime < 0) {
      window.alert("Please provide a valid start time.");
      return;
    }

    if (isNaN(endTime) || endTime <= 0) {
      window.alert("Please provide a valid end time.");
      return;
    }

    if (startTime >= endTime) {
      window.alert("Start time must be strictly less than End time.");
      return;
    }

    try {
      if (outVideo) {
        URL.revokeObjectURL(outVideo);
        setOutVideo(null);
      }
      const trimmedUrl = await trimVideo(inputVideo, startTime, endTime);
      setOutVideo(trimmedUrl);
    } catch (err) {
      window.alert(`Trimming failed: ${err.message || "Unknown error"}`);
    }
  }, [isProcessing, inputVideo, startTime, endTime, outVideo, trimVideo]);

  return (
    <section className="w-full flex flex-col items-center">
      <VideoPlayer
        videoRef={videoRef}
        videoUrl={inputVideoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPause={() => setIsPreviewPlaying(false)}
        onEnded={() => setIsPreviewPlaying(false)}
      />

      {inputVideo && duration > 0 && (
        <>
          <TimelineScrubber
            timelineRef={timelineRef}
            duration={duration}
            currentTime={currentTime}
            startTime={startTime}
            endTime={endTime}
            disabled={isProcessing}
            isPreviewPlaying={isPreviewPlaying}
            onTrackClick={handleTrackClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onSetStartToCurrent={setStartToCurrent}
            onSetEndToCurrent={setEndToCurrent}
            onTogglePreviewTrim={togglePreviewTrim}
          />

          {/* Keyframe Notice / Tooltip */}
          <div className="flex items-start sm:items-center gap-2 text-xs text-blue-300/90 bg-blue-950/40 border border-blue-800/50 rounded-xl px-3.5 py-2.5 my-2 w-full max-w-xl shadow-sm">
            <svg
              className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 sm:mt-0"
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
              <strong>Lossless Trimming:</strong> Cuts snap to the nearest keyframe without re-encoding to preserve 100% original video quality and complete in seconds.
            </span>
          </div>
        </>
      )}

      <FilePicker
        selectedFile={inputVideo}
        onFileSelect={handleFileSelect}
        disabled={isProcessing}
      />

      {inputVideo && (
        <TimeInputs
          startTime={startTime}
          endTime={endTime}
          duration={duration}
          disabled={isProcessing}
          isProcessing={isProcessing}
          onStartTimeChange={updateStartTime}
          onEndTimeChange={updateEndTime}
          onConvert={handleConvert}
        />
      )}

      <ProgressBar
        isProcessing={isProcessing}
        progress={progress}
        stage={processingStage}
        logMessage={logMessage}
      />

      <OutputPreview
        outUrl={outVideo}
        originalFileName={inputVideo?.name}
      />
    </section>
  );
}
