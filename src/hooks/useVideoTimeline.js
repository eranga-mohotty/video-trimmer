import { useState, useRef, useCallback } from "react";
import { clamp } from "../utils/time";

/**
 * Custom hook managing video timeline state, playback synchronization,
 * marker dragging, and trim auditioning.
 */
export function useVideoTimeline() {
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  const reset = useCallback(() => {
    setDuration(0);
    setCurrentTime(0);
    setStartTime(0);
    setEndTime(0);
    setDraggingHandle(null);
    setIsPreviewPlaying(false);
  }, []);

  const seek = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleLoadedMetadata = useCallback((e) => {
    const dur = Number(e.currentTarget.duration.toFixed(1));
    setDuration(dur);
    setStartTime(0);
    setEndTime(dur);
    setCurrentTime(0);
  }, []);

  const handleTimeUpdate = useCallback(
    (e) => {
      const cur = e.currentTarget.currentTime;
      setCurrentTime(cur);
      if (isPreviewPlaying && cur >= endTime) {
        if (videoRef.current) {
          videoRef.current.pause();
        }
        setIsPreviewPlaying(false);
      }
    },
    [isPreviewPlaying, endTime],
  );

  const updateStartTime = useCallback(
    (val) => {
      const valid = clamp(val, 0, Math.max(0, endTime - 0.1));
      const rounded = Number(valid.toFixed(1));
      setStartTime(rounded);
      seek(rounded);
    },
    [endTime, seek],
  );

  const updateEndTime = useCallback(
    (val) => {
      const valid = clamp(val, startTime + 0.1, duration || val);
      const rounded = Number(valid.toFixed(1));
      setEndTime(rounded);
      seek(rounded);
    },
    [startTime, duration, seek],
  );

  const handleTrackClick = useCallback(
    (e) => {
      if (!timelineRef.current || duration <= 0 || draggingHandle) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clickX = clamp(e.clientX - rect.left, 0, rect.width);
      const seekTime = Number(((clickX / rect.width) * duration).toFixed(1));
      seek(seekTime);
    },
    [duration, draggingHandle, seek],
  );

  const handlePointerDown = useCallback((type, e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraggingHandle(type);
  }, []);

  const handlePointerMove = useCallback(
    (type, e) => {
      if (!timelineRef.current || duration <= 0) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clampedX = clamp(e.clientX - rect.left, 0, rect.width);
      const newTime = Number(((clampedX / rect.width) * duration).toFixed(1));

      if (type === "start") {
        updateStartTime(newTime);
      } else if (type === "end") {
        updateEndTime(newTime);
      }
    },
    [duration, updateStartTime, updateEndTime],
  );

  const handlePointerUp = useCallback((e) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
    setDraggingHandle(null);
  }, []);

  const setStartToCurrent = useCallback(() => {
    if (!videoRef.current) return;
    const cur = Number(videoRef.current.currentTime.toFixed(1));
    updateStartTime(cur);
  }, [updateStartTime]);

  const setEndToCurrent = useCallback(() => {
    if (!videoRef.current) return;
    const cur = Number(videoRef.current.currentTime.toFixed(1));
    updateEndTime(cur);
  }, [updateEndTime]);

  const togglePreviewTrim = useCallback(() => {
    if (!videoRef.current) return;
    if (isPreviewPlaying) {
      videoRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
      setIsPreviewPlaying(true);
    }
  }, [isPreviewPlaying, startTime]);

  return {
    videoRef,
    timelineRef,
    duration,
    currentTime,
    startTime,
    endTime,
    draggingHandle,
    isPreviewPlaying,
    setIsPreviewPlaying,
    reset,
    seek,
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
  };
}
