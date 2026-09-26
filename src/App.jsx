import { useState, useEffect, useRef, useMemo } from "react";

import "./App.css";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

function App() {
  const [isFFmpegLoaded, setIsFFmpegLoaded] = useState(false);
  const [inputVideo, setInputVideo] = useState();
  const [outVideo, setOutVideo] = useState();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState("");

  const ffmpegRef = useRef(new FFmpeg());
  const messageRef = useRef(null);

  const inputVideoUrl = useMemo(() => {
    if (!inputVideo) return null;
    return URL.createObjectURL(inputVideo);
  }, [inputVideo]);

  // Clean up input video object URL when inputVideo changes or unmounts
  useEffect(() => {
    return () => {
      if (inputVideoUrl) {
        URL.revokeObjectURL(inputVideoUrl);
      }
    };
  }, [inputVideoUrl]);

  // Clean up output video object URL when outVideo changes or unmounts
  useEffect(() => {
    return () => {
      if (outVideo) {
        URL.revokeObjectURL(outVideo);
      }
    };
  }, [outVideo]);

  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on("log", ({ message }) => {
      if (messageRef.current) {
        messageRef.current.innerText = message;
      }
      console.log(message);
    });
    ffmpeg.on("progress", ({ progress }) => {
      const pct = Math.max(0, Math.min(100, Math.round((progress || 0) * 100)));
      setProgress(pct);
      setProcessingStage(`Trimming video... ${pct}%`);
    });
    await ffmpeg.load();
    setIsFFmpegLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const validateAndTrim = () => {
    if (isProcessing) return;

    let isValid = true;
    let LogString = "";
    const start_time = document.getElementById("video_start").value;
    const end_time = document.getElementById("video_end").value;
    const input_video_duration =
      document.getElementById("input_video").duration;
    let valid_start;
    let valid_end;
    if (
      !isNaN(start_time) &&
      start_time >= 0 &&
      (isNaN(input_video_duration) || start_time < input_video_duration)
    ) {
      valid_start = start_time;
    } else {
      valid_start = 0;
      LogString +=
        "invalid Start time, trimming will be attempted with default value of 0 ";
      isValid = false;
    }
    if (
      !isNaN(end_time) &&
      end_time > 0 &&
      (isNaN(input_video_duration) || end_time <= input_video_duration)
    ) {
      valid_end = end_time;
    } else {
      if (isNaN(input_video_duration)) {
        alert("End time must be provided.");
        return;
      }
      valid_end = input_video_duration;
      LogString += `Invalid End time, trimming will be attempted with default value of ${input_video_duration} `;
      isValid = false;
    }
    if (valid_start > valid_end) {
      [valid_start, valid_end] = [valid_end, valid_start];
      LogString +=
        "Start time must be less than End time, trimming will be attempted with times swapped ";
      console.log(
        `start_time=${start_time}\n end_time=${end_time} \n valid_start=${valid_start}\n valid_end=${valid_end}\n input_video_duration=${input_video_duration}`,
      );
      isValid = false;
    }
    if (!isValid) {
      window.alert(LogString);
      console.warn(LogString);
    }

    trimMediaStream(valid_start, valid_end);
  };

  const trimMediaStream = async (start_time, end_time) => {
    const ffmpeg = ffmpegRef.current;
    setIsProcessing(true);
    setProgress(0);
    setProcessingStage("Loading video into memory...");
    const media_extension = inputVideo.name.split(".").slice(-1)[0];

    try {
      await ffmpeg.writeFile(inputVideo.name, await fetchFile(inputVideo));
      setProcessingStage("Trimming video... 0%");

      await ffmpeg.exec([
        "-ss",
        String(start_time),
        "-to",
        String(end_time),
        "-i",
        inputVideo.name,
        "-c",
        "copy",
        `out.${media_extension}`,
      ]);

      setProcessingStage("Preparing output preview...");
      setProgress(100);

      const data = await ffmpeg.readFile(`out.${media_extension}`);
      const outVideoUrl = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/*" }),
      );
      setOutVideo(outVideoUrl);
      setProcessingStage("Trimming complete!");

      // Clean up virtual files from FFmpeg memory
      try {
        await ffmpeg.deleteFile(inputVideo.name);
        await ffmpeg.deleteFile(`out.${media_extension}`);
      } catch (cleanErr) {
        console.debug("Virtual file cleanup:", cleanErr);
      }
    } catch (err) {
      console.error("Error during video trimming:", err);
      window.alert(
        `Error trimming video: ${err.message || "Operation failed"}`,
      );
      setProcessingStage("Trimming failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-gray-800 min-h-screen text-gray-100 flex flex-col items-center">
      <h1 className="text-5xl p-5 font-bold">Video Trimmer</h1>
      {isFFmpegLoaded ? (
        <div className="p-5 flex flex-col items-center max-w-2xl w-full">
          {inputVideoUrl && (
            <video
              id="input_video"
              controls
              className="p-5 max-w-full rounded-lg"
              src={inputVideoUrl}
            ></video>
          )}

          <div className="my-4 flex flex-col items-center">
            <label
              htmlFor="videoPicker"
              className={`font-semibold py-2 px-4 rounded border border-blue-500 transition-colors ${
                isProcessing
                  ? "opacity-50 cursor-not-allowed text-gray-400 border-gray-600"
                  : "bg-transparent hover:bg-blue-600 text-blue-400 hover:text-white cursor-pointer"
              }`}
            >
              Select video
            </label>
            <input
              className="hidden"
              type="file"
              id="videoPicker"
              accept="video/*"
              disabled={isProcessing}
              onChange={(e) => {
                const file = e.target.files?.item(0);
                setInputVideo(file);
                setOutVideo(undefined);
                setProgress(0);
                setProcessingStage("");
              }}
            />
            {inputVideo && (
              <span className="text-xs text-gray-400 mt-2">
                {inputVideo.name}
              </span>
            )}
          </div>

          {inputVideo && (
            <div className="w-full flex flex-col items-center">
              <span className="text-sm text-gray-300 mb-3">
                Enter times in Seconds
              </span>
              <div className="flex flex-row ps-5 mb-3 items-center w-full max-w-xs justify-between">
                <label className="pe-3 text-sm" htmlFor="video_start">
                  Start:
                </label>
                <input
                  type="number"
                  id="video_start"
                  defaultValue="0"
                  disabled={isProcessing}
                  className="shadow appearance-none border border-gray-600 rounded w-36 py-2 px-3 text-gray-100 bg-gray-700 leading-tight focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>
              <div className="flex flex-row ps-5 mb-3 items-center w-full max-w-xs justify-between">
                <label className="pe-3 text-sm" htmlFor="video_end">
                  End:&nbsp;
                </label>
                <input
                  type="number"
                  id="video_end"
                  disabled={isProcessing}
                  className="shadow appearance-none border border-gray-600 rounded w-36 py-2 px-3 text-gray-100 bg-gray-700 leading-tight focus:outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <button
                disabled={isProcessing}
                className={`font-semibold py-2 px-6 rounded my-4 flex items-center gap-2 transition-all ${
                  isProcessing
                    ? "bg-blue-600/50 text-gray-300 cursor-not-allowed border border-blue-400/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow hover:shadow-lg"
                }`}
                onClick={validateAndTrim}
              >
                {isProcessing ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  "Convert"
                )}
              </button>

              {/* Visual Progress Indicator */}
              {(isProcessing || processingStage) && (
                <div className="w-full max-w-md mx-auto my-3 p-4 bg-gray-900/90 rounded-xl border border-gray-700 shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
                      {isProcessing && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                      )}
                      {processingStage || "Processing..."}
                    </span>
                    <span className="text-sm font-bold text-blue-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ease-out ${
                        progress === 100 ? "bg-green-500" : "bg-blue-500"
                      } ${isProcessing && progress === 0 ? "w-full animate-pulse opacity-75" : ""}`}
                      style={{
                        width:
                          isProcessing && progress === 0
                            ? "100%"
                            : `${progress}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              <p
                ref={messageRef}
                className="text-xs text-gray-400 max-w-md truncate mt-2 font-mono"
              ></p>
            </div>
          )}

          {outVideo && (
            <div className="flex flex-col items-center my-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-200">
                Trimmed Video Preview
              </h2>
              <video
                className="p-2 max-w-full rounded-lg"
                controls
                src={outVideo}
              />
              <a
                href={outVideo}
                download={"trimmed_" + (inputVideo?.name || "video.mp4")}
                className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded shadow hover:shadow-lg transition-all m-4 inline-block"
              >
                Download video
              </a>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-center w-full h-[80vh] text-gray-100">
            <div>
              <h1 className="text-xl md:text-7xl font-bold flex items-center">
                L
                <svg
                  stroke="currentColor"
                  fill="currentColor"
                  strokeWidth="0"
                  viewBox="0 0 24 24"
                  className="animate-spin"
                  height="1em"
                  width="1em"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM13.6695 15.9999H10.3295L8.95053 17.8969L9.5044 19.6031C10.2897 19.8607 11.1286 20 12 20C12.8714 20 13.7103 19.8607 14.4956 19.6031L15.0485 17.8969L13.6695 15.9999ZM5.29354 10.8719L4.00222 11.8095L4 12C4 13.7297 4.54894 15.3312 5.4821 16.6397L7.39254 16.6399L8.71453 14.8199L7.68654 11.6499L5.29354 10.8719ZM18.7055 10.8719L16.3125 11.6499L15.2845 14.8199L16.6065 16.6399L18.5179 16.6397C19.4511 15.3312 20 13.7297 20 12L19.997 11.81L18.7055 10.8719ZM12 9.536L9.656 11.238L10.552 14H13.447L14.343 11.238L12 9.536ZM14.2914 4.33299L12.9995 5.27293V7.78993L15.6935 9.74693L17.9325 9.01993L18.4867 7.3168C17.467 5.90685 15.9988 4.84254 14.2914 4.33299ZM9.70757 4.33329C8.00021 4.84307 6.53216 5.90762 5.51261 7.31778L6.06653 9.01993L8.30554 9.74693L10.9995 7.78993V5.27293L9.70757 4.33329Z"></path>
                </svg>
                ading FFmpeg.wasm. . .
              </h1>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
