import { useState, useEffect, useMemo, useCallback } from "react";
import "./App.css";

// Custom Hooks
import { useFFmpeg } from "./hooks/useFFmpeg";
import { useVideoTimeline } from "./hooks/useVideoTimeline";

// Presentational Components
import { Header } from "./components/Header";
import { FFmpegLoader } from "./components/FFmpegLoader";
import { FilePicker } from "./components/FilePicker";
import { VideoPlayer } from "./components/VideoPlayer";
import { TimelineScrubber } from "./components/TimelineScrubber";
import { TimeInputs } from "./components/TimeInputs";
import { ProgressBar } from "./components/ProgressBar";
import { TrimmedVideoPreview } from "./components/TrimmedVideoPreview";

export default function App() {
  const [inputVideo, setInputVideo] = useState(null);
  const [outVideo, setOutVideo] = useState(null);

  // Hook 1: FFmpeg Engine
  const {
    isLoaded,
    isProcessing,
    progress,
    processingStage,
    logMessage,
    trimVideo,
  } = useFFmpeg();

  // Hook 2: Video Timeline & Playback
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
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center px-4 pb-12 selection:bg-blue-600 selection:text-white">
      <Header />

      {!isLoaded ? (
        <FFmpegLoader />
      ) : (
        <main className="w-full max-w-2xl flex flex-col items-center">
          <VideoPlayer
            videoRef={videoRef}
            videoUrl={inputVideoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPause={() => setIsPreviewPlaying(false)}
            onEnded={() => setIsPreviewPlaying(false)}
          />

          {inputVideo && duration > 0 && (
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

          <TrimmedVideoPreview
            outVideoUrl={outVideo}
            originalFileName={inputVideo?.name}
          />
        </main>
      )}
    </div>
  );
}
