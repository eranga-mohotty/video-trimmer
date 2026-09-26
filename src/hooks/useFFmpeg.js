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
  const currentOpRef = useRef("Processing");
  const recentLogsRef = useRef([]);

  useEffect(() => {
    let isMounted = true;
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      if (isMounted) {
        setLogMessage(message);
        recentLogsRef.current.push(message);
        if (recentLogsRef.current.length > 20) {
          recentLogsRef.current.shift();
        }
      }
    });

    ffmpeg.on("progress", ({ progress }) => {
      if (isMounted) {
        const pct = Math.max(
          0,
          Math.min(100, Math.round((progress || 0) * 100)),
        );
        setProgress(pct);
        setProcessingStage(`${currentOpRef.current}... ${pct}%`);
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
   * Helper to inspect recent logs for recognizable error patterns.
   */
  const getFriendlyError = (defaultMsg) => {
    const combined = recentLogsRef.current.join(" ").toLowerCase();
    if (
      combined.includes("matches no streams") ||
      combined.includes("does not contain any stream")
    ) {
      return "No matching stream found in this video file.";
    }
    if (
      combined.includes("could not find tag for codec") ||
      combined.includes("not supported by") ||
      combined.includes("only vp8 or vp9 or av1")
    ) {
      return "The source codec is incompatible with this container in lossless mode.";
    }
    return defaultMsg;
  };

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

    currentOpRef.current = "Trimming video";
    recentLogsRef.current = [];
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
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/*" }),
      );
      setProcessingStage("Trimming complete!");

      return url;
    } catch (err) {
      console.error("Error during video trimming:", err);
      const friendly = getFriendlyError(err.message || "Trimming failed");
      setProcessingStage("Trimming failed");
      throw new Error(friendly);
    } finally {
      setIsProcessing(false);
      try {
        await ffmpeg.deleteFile(inName);
        await ffmpeg.deleteFile(outName);
      } catch (cleanErr) {
        console.debug("Virtual file cleanup:", cleanErr);
      }
    }
  }, []);

  /**
   * Extracts audio stream using stream copy (-vn -c:a copy).
   * @param {File} file - Input video file.
   * @param {string} targetFormat - Output audio format (e.g. 'm4a', 'aac', 'mp3', 'opus').
   * @returns {Promise<string>} Blob URL of extracted audio.
   */
  const extractAudio = useCallback(async (file, targetFormat = "m4a") => {
    if (!file) throw new Error("No input video file provided");
    const ffmpeg = ffmpegRef.current;

    currentOpRef.current = "Extracting audio";
    recentLogsRef.current = [];
    setIsProcessing(true);
    setProgress(0);
    setProcessingStage("Loading video into memory...");

    const inExt = file.name.split(".").slice(-1)[0] || "mp4";
    const cleanFmt = targetFormat.replace(/^\./, "").toLowerCase();
    const inName = `input_${Date.now()}.${inExt}`;
    const outName = `out_${Date.now()}.${cleanFmt}`;

    try {
      await ffmpeg.writeFile(inName, await fetchFile(file));
      setProcessingStage("Extracting audio... 0%");

      await ffmpeg.exec(["-i", inName, "-vn", "-c:a", "copy", outName]);

      setProcessingStage("Preparing audio preview...");
      setProgress(100);

      const data = await ffmpeg.readFile(outName);
      const mimeMap = {
        m4a: "audio/mp4",
        aac: "audio/aac",
        mp3: "audio/mpeg",
        opus: "audio/opus",
        ogg: "audio/ogg",
        wav: "audio/wav",
      };
      const mimeType = mimeMap[cleanFmt] || "audio/*";
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: mimeType }),
      );
      setProcessingStage("Audio extraction complete!");

      return url;
    } catch (err) {
      console.error("Error during audio extraction:", err);
      const friendly = getFriendlyError(
        err.message || "Audio extraction failed",
      );
      setProcessingStage("Extraction failed");
      throw new Error(friendly);
    } finally {
      setIsProcessing(false);
      try {
        await ffmpeg.deleteFile(inName);
        await ffmpeg.deleteFile(outName);
      } catch (cleanErr) {
        console.debug("Virtual file cleanup:", cleanErr);
      }
    }
  }, []);

  /**
   * Removes audio, subtitle, or metadata streams losslessly.
   * @param {File} file - Input video file.
   * @param {Object} options - { removeAudio, removeSubtitles, removeMetadata }
   * @returns {Promise<string>} Blob URL of the modified video.
   */
  const removeStreams = useCallback(
    async (
      file,
      { removeAudio = true, removeSubtitles = false, removeMetadata = false } = {},
    ) => {
      if (!file) throw new Error("No input video file provided");
      const ffmpeg = ffmpegRef.current;

      currentOpRef.current = "Removing streams";
      recentLogsRef.current = [];
      setIsProcessing(true);
      setProgress(0);
      setProcessingStage("Loading video into memory...");

      const ext = file.name.split(".").slice(-1)[0] || "mp4";
      const inName = `input_${Date.now()}.${ext}`;
      const outName = `out_${Date.now()}.${ext}`;

      const args = ["-i", inName, "-c:v", "copy"];
      if (removeAudio) {
        args.push("-an");
      } else {
        args.push("-c:a", "copy");
      }
      if (removeSubtitles) {
        args.push("-sn");
      }
      if (removeMetadata) {
        args.push("-dn", "-map_metadata", "-1");
      }
      if (["mp4", "mov", "m4v"].includes(ext.toLowerCase())) {
        args.push("-movflags", "+faststart");
      }
      args.push(outName);

      try {
        await ffmpeg.writeFile(inName, await fetchFile(file));
        setProcessingStage("Removing streams... 0%");

        await ffmpeg.exec(args);

        setProcessingStage("Preparing output preview...");
        setProgress(100);

        const data = await ffmpeg.readFile(outName);
        const url = URL.createObjectURL(
          new Blob([data.buffer], { type: "video/*" }),
        );
        setProcessingStage("Stream removal complete!");

        return url;
      } catch (err) {
        console.error("Error during stream removal:", err);
        const friendly = getFriendlyError(
          err.message || "Stream removal failed",
        );
        setProcessingStage("Stream removal failed");
        throw new Error(friendly);
      } finally {
        setIsProcessing(false);
        try {
          await ffmpeg.deleteFile(inName);
          await ffmpeg.deleteFile(outName);
        } catch (cleanErr) {
          console.debug("Virtual file cleanup:", cleanErr);
        }
      }
    },
    [],
  );

  /**
   * Remuxes video to a different container losslessly (-c copy).
   * @param {File} file - Input video file.
   * @param {string} targetContainer - Target format extension (e.g. 'mkv', 'mp4', 'webm', 'mov').
   * @returns {Promise<string>} Blob URL of the remuxed video.
   */
  const switchContainer = useCallback(
    async (file, targetContainer = "mkv") => {
      if (!file) throw new Error("No input video file provided");
      const ffmpeg = ffmpegRef.current;

      currentOpRef.current = "Remuxing container";
      recentLogsRef.current = [];
      setIsProcessing(true);
      setProgress(0);
      setProcessingStage("Loading video into memory...");

      const inExt = file.name.split(".").slice(-1)[0] || "mp4";
      const cleanTarget = targetContainer.replace(/^\./, "").toLowerCase();
      const inName = `input_${Date.now()}.${inExt}`;
      const outName = `out_${Date.now()}.${cleanTarget}`;

      const args = ["-i", inName, "-c", "copy"];
      if (["mp4", "mov", "m4v"].includes(cleanTarget)) {
        args.push("-movflags", "+faststart");
      }
      args.push(outName);

      try {
        await ffmpeg.writeFile(inName, await fetchFile(file));
        setProcessingStage(`Remuxing to ${cleanTarget.toUpperCase()}... 0%`);

        await ffmpeg.exec(args);

        setProcessingStage("Preparing output download...");
        setProgress(100);

        const data = await ffmpeg.readFile(outName);
        const url = URL.createObjectURL(
          new Blob([data.buffer], { type: `video/${cleanTarget}` }),
        );
        setProcessingStage("Remux complete!");

        return url;
      } catch (err) {
        console.error("Error during container switch:", err);
        const friendly = getFriendlyError(
          err.message || "Container remuxing failed",
        );
        setProcessingStage("Remuxing failed");
        throw new Error(friendly);
      } finally {
        setIsProcessing(false);
        try {
          await ffmpeg.deleteFile(inName);
          await ffmpeg.deleteFile(outName);
        } catch (cleanErr) {
          console.debug("Virtual file cleanup:", cleanErr);
        }
      }
    },
    [],
  );

  return {
    isLoaded,
    isProcessing,
    progress,
    processingStage,
    logMessage,
    trimVideo,
    extractAudio,
    removeStreams,
    switchContainer,
  };
}
