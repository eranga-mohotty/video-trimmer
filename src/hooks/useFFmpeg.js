import { useState, useEffect, useRef, useCallback } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { parseAudioStreams } from "../utils/audioTracks";

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
  const activeVirtualFileRef = useRef(null); // { file, inName }

  useEffect(() => {
    let isMounted = true;
    const ffmpeg = ffmpegRef.current;

    ffmpeg.on("log", ({ message }) => {
      if (isMounted) {
        setLogMessage(message);
        recentLogsRef.current.push(message);
        if (recentLogsRef.current.length > 30) {
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
   * Helper to write file once into MEMFS and cache its virtual name.
   */
  const getOrWriteVirtualFile = async (file) => {
    const ffmpeg = ffmpegRef.current;
    if (activeVirtualFileRef.current?.file === file) {
      return activeVirtualFileRef.current.inName;
    }

    if (activeVirtualFileRef.current?.inName) {
      try {
        await ffmpeg.deleteFile(activeVirtualFileRef.current.inName);
      } catch (cleanErr) {
        console.debug("Previous virtual file cleanup:", cleanErr);
      }
      activeVirtualFileRef.current = null;
    }

    const inExt = file.name.split(".").slice(-1)[0] || "mp4";
    const inName = `input_${Date.now()}.${inExt}`;
    await ffmpeg.writeFile(inName, await fetchFile(file));
    activeVirtualFileRef.current = { file, inName };
    return inName;
  };

  /**
   * Cleans up any cached virtual file from MEMFS.
   */
  const cleanupVirtualFiles = useCallback(async () => {
    if (activeVirtualFileRef.current?.inName) {
      try {
        await ffmpegRef.current.deleteFile(activeVirtualFileRef.current.inName);
      } catch (cleanErr) {
        console.debug("Cleanup virtual file:", cleanErr);
      }
      activeVirtualFileRef.current = null;
    }
  }, []);

  /**
   * Probes a media file for audio streams and their metadata (codec, language, channels).
   * @param {File} file - Input video file.
   * @returns {Promise<Array<Object>>} List of detected audio tracks.
   */
  const probeAudioTracks = useCallback(async (file) => {
    if (!file) return [];
    const ffmpeg = ffmpegRef.current;

    const inName = await getOrWriteVirtualFile(file);
    const capturedLogs = [];

    const logHandler = ({ message }) => {
      capturedLogs.push(message);
    };

    ffmpeg.on("log", logHandler);

    try {
      await ffmpeg.exec(["-hide_banner", "-i", inName]);
    } catch {
      // Non-zero exit code expected as no output was specified
    } finally {
      if (ffmpeg.off) {
        ffmpeg.off("log", logHandler);
      }
    }

    return parseAudioStreams(capturedLogs);
  }, []);

  /**
   * Helper to inspect recent logs for recognizable error patterns.
   */
  const getFriendlyError = (defaultMsg) => {
    const combined = recentLogsRef.current.join("\n");
    const lower = combined.toLowerCase();

    // Check if we can extract source audio codec from FFmpeg stream announcement
    // Examples: "Stream #0:1(eng): Audio: eac3" or "Stream #0:2: Audio: aac"
    const audioCodecMatch = combined.match(
      /Stream #0:\d+.*?: Audio: ([a-zA-Z0-9_-]+)/i,
    );
    const detectedCodec = audioCodecMatch
      ? audioCodecMatch[1].toUpperCase()
      : null;

    if (
      lower.includes("matches no streams") ||
      lower.includes("does not contain any stream") ||
      lower.includes("output file #0 does not contain any stream")
    ) {
      return "No audio stream found in this video file.";
    }

    if (
      lower.includes("only aac streams can be muxed") ||
      lower.includes("only mp3 was expected") ||
      lower.includes("only opus streams can be muxed") ||
      lower.includes("could not find tag for codec") ||
      lower.includes("not supported by") ||
      lower.includes("only vp8 or vp9 or av1") ||
      lower.includes("error initializing output stream") ||
      lower.includes("incorrect codec parameters") ||
      lower.includes("could not write header") ||
      lower.includes("codec not currently supported in container")
    ) {
      if (detectedCodec) {
        return `Incompatible format: The source audio stream is encoded in ${detectedCodec}, which cannot be losslessly copied into this container. Try selecting .${detectedCodec.toLowerCase()} or .mka (Universal Matroska Audio).`;
      }
      return "The source audio codec is incompatible with the selected container format in lossless mode. Try selecting a different format (such as .mka, .eac3, or .ac3).";
    }

    if (lower.includes("out of memory") || lower.includes("abort(")) {
      return "Out of memory: The file is too large for the WebAssembly memory limit.";
    }

    if (
      detectedCodec &&
      (defaultMsg.includes("0 bytes") || defaultMsg.includes("empty"))
    ) {
      return `The extracted audio file is empty (0 bytes). The source audio codec (${detectedCodec}) cannot be stored in this container losslessly. Try selecting .${detectedCodec.toLowerCase()} or .mka.`;
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

      const exitCode = await ffmpeg.exec([
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

      if (exitCode !== 0) {
        throw new Error(`FFmpeg exited with error code ${exitCode}`);
      }

      setProcessingStage("Preparing output preview...");
      setProgress(100);

      const data = await ffmpeg.readFile(outName);
      if (!data || data.byteLength === 0) {
        throw new Error("Output video file is empty (0 bytes).");
      }

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
   * @param {string} targetFormat - Output audio format (e.g. 'm4a', 'aac', 'mp3', 'opus', 'eac3', 'ac3', 'mka').
   * @param {number} [audioIndex=0] - 0-based audio stream index to extract.
   * @returns {Promise<string>} Blob URL of extracted audio.
   */
  const extractAudio = useCallback(
    async (file, targetFormat = "m4a", audioIndex = 0) => {
      if (!file) throw new Error("No input video file provided");
      const ffmpeg = ffmpegRef.current;

      currentOpRef.current = "Extracting audio";
      recentLogsRef.current = [];
      setIsProcessing(true);
      setProgress(0);
      setProcessingStage("Loading video into memory...");

      const inName = await getOrWriteVirtualFile(file);
      const cleanFmt = targetFormat.replace(/^\./, "").toLowerCase();
      const outName = `out_${Date.now()}.${cleanFmt}`;

      try {
        setProcessingStage("Extracting audio... 0%");

        const exitCode = await ffmpeg.exec([
          "-i",
          inName,
          "-map",
          `0:a:${audioIndex}`,
          "-vn",
          "-c:a",
          "copy",
          outName,
        ]);

        if (exitCode !== 0) {
          throw new Error(`FFmpeg exited with error code ${exitCode}`);
        }

        setProcessingStage("Preparing audio preview...");
        setProgress(100);

        const data = await ffmpeg.readFile(outName);
        if (!data || data.byteLength === 0) {
          throw new Error("Extracted audio file is empty (0 bytes).");
        }

        const mimeMap = {
          m4a: "audio/mp4",
          aac: "audio/aac",
          mp3: "audio/mpeg",
          opus: "audio/opus",
          ogg: "audio/ogg",
          wav: "audio/wav",
          flac: "audio/flac",
          eac3: "audio/eac3",
          ac3: "audio/ac3",
          mka: "audio/x-matroska",
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
          await ffmpeg.deleteFile(outName);
        } catch (cleanErr) {
          console.debug("Virtual file cleanup:", cleanErr);
        }
      }
    },
    [],
  );

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

        const exitCode = await ffmpeg.exec(args);
        if (exitCode !== 0) {
          throw new Error(`FFmpeg exited with error code ${exitCode}`);
        }

        setProcessingStage("Preparing output preview...");
        setProgress(100);

        const data = await ffmpeg.readFile(outName);
        if (!data || data.byteLength === 0) {
          throw new Error("Processed video file is empty (0 bytes).");
        }

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

        const exitCode = await ffmpeg.exec(args);
        if (exitCode !== 0) {
          throw new Error(`FFmpeg exited with error code ${exitCode}`);
        }

        setProcessingStage("Preparing output download...");
        setProgress(100);

        const data = await ffmpeg.readFile(outName);
        if (!data || data.byteLength === 0) {
          throw new Error("Remuxed video file is empty (0 bytes).");
        }

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
    probeAudioTracks,
    cleanupVirtualFiles,
  };
}
