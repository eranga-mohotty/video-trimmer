import { useState, useEffect, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

/**
 * Custom hook encapsulating FFmpeg.wasm lifecycle, log streaming,
 * progress tracking, and video trimming execution.
 */
export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");
  const [logMessage, setLogMessage] = useState("");

  const ffmpegRef = useRef(new FFmpeg());

  useEffect(() => {
    let isMounted = true;
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      if (isMounted) setLogMessage(message);
    });

    ffmpeg.on("progress", ({ progress }) => {
      if (isMounted) {
        const pct = Math.max(0, Math.min(100, Math.round((progress || 0) * 100)));
        setProgress(pct);
        setProcessingStage(`Trimming video... ${pct}%`);
      }
    });

    const init = async () => {
      try {
        await ffmpeg.load();
        if (isMounted) setIsLoaded(true);
      } catch (err) {
        console.error("FFmpeg initialization failed:", err);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Trims a video file using stream copy (-c copy).
   * @param {File} file - Input video file.
   * @param {number} startTime - Start time in seconds.
   * @param {number} endTime - End time in seconds.
   * @returns {Promise<string>} Blob URL of the trimmed video.
   */
  const trimVideo = useCallback(async (file, startTime, endTime) => {
    if (!file) throw new Error("No input video file provided");
    const ffmpeg = ffmpegRef.current;

    setIsProcessing(true);
    setProgress(0);
    setProcessingStage("Loading video into memory...");

    const ext = file.name.split(".").slice(-1)[0] || "mp4";
    const inName = `input_${Date.now()}.${ext}`;
    const outName = `out_${Date.now()}.${ext}`;

    try {
      await ffmpeg.writeFile(inName, await fetchFile(file));
      setProcessingStage("Trimming video... 0%");

      await ffmpeg.exec([
        "-ss",
        String(startTime),
        "-to",
        String(endTime),
        "-i",
        inName,
        "-c",
        "copy",
        outName,
      ]);

      setProcessingStage("Preparing output preview...");
      setProgress(100);

      const data = await ffmpeg.readFile(outName);
      const url = URL.createObjectURL(new Blob([data.buffer], { type: "video/*" }));
      setProcessingStage("Trimming complete!");

      // Cleanup virtual files from MEMFS to keep memory usage low
      try {
        await ffmpeg.deleteFile(inName);
        await ffmpeg.deleteFile(outName);
      } catch (cleanErr) {
        console.debug("Virtual file cleanup:", cleanErr);
      }

      return url;
    } catch (err) {
      console.error("Error during video trimming:", err);
      setProcessingStage("Trimming failed");
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isLoaded,
    isProcessing,
    progress,
    processingStage,
    logMessage,
    trimVideo,
  };
}
