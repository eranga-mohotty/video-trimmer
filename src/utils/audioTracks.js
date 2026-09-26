/**
 * Formats a language code into a human-readable language name using standard Intl API.
 * e.g., 'eng' -> 'English', 'jpn' -> 'Japanese', 'spa' -> 'Spanish'.
 * @param {string} code - ISO-639-1 or ISO-639-2 language code.
 * @returns {string} Formatted language name or original code.
 */
export function formatLanguage(code) {
  if (!code || code === "und") return "";
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "language" });
    return dn.of(code) || code;
  } catch {
    return code;
  }
}

/**
 * Maps a raw FFmpeg audio codec identifier to a recommended lossless container extension.
 * @param {string} codec - Raw codec name (e.g. 'eac3', 'aac', 'opus').
 * @param {string} [containerExt] - Original video container extension.
 * @returns {string} Recommended output audio extension.
 */
export function getRecommendedFormatForCodec(codec, containerExt = "") {
  if (!codec) return "m4a";
  const c = codec.toLowerCase();

  switch (c) {
    case "eac3":
      return "eac3";
    case "ac3":
      return "ac3";
    case "opus":
      return "opus";
    case "flac":
      return "flac";
    case "mp3":
      return "mp3";
    case "aac":
      return "m4a";
    case "vorbis":
      return "ogg";
    case "pcm_s16le":
    case "pcm_s24le":
    case "wav":
      return "wav";
    default:
      // If unknown codec in MKV, MKA can hold anything losslessly
      return containerExt.toLowerCase() === "mkv" ? "mka" : "m4a";
  }
}

/**
 * Parses FFmpeg header inspection logs to extract audio tracks and their metadata.
 * @param {string[]} logLines - Array of log output strings from FFmpeg.
 * @returns {Array<Object>} List of detected audio tracks.
 */
export function parseAudioStreams(logLines) {
  const tracks = [];
  let currentTrack = null;
  let audioIndex = 0;

  for (let i = 0; i < logLines.length; i++) {
    const line = logLines[i] || "";

    // Match audio stream line:
    // e.g., "Stream #0:1(eng): Audio: eac3, 48000 Hz, 5.1(side), fltp, 640 kb/s (default)"
    // or    "Stream #0:2: Audio: aac (LC), 44100 Hz, stereo, fltp"
    const streamMatch = line.match(
      /Stream #0:(\d+)(?:\(([a-zA-Z0-9_-]+)\))?:\s*Audio:\s*([a-zA-Z0-9_-]+)/i,
    );

    if (streamMatch) {
      const streamId = parseInt(streamMatch[1], 10);
      const rawLang = streamMatch[2] || "";
      const codec = streamMatch[3].toLowerCase();

      // Extract sample rate (e.g. "48000 Hz")
      const sampleRateMatch = line.match(/(\d+\s*Hz)/i);
      const sampleRate = sampleRateMatch ? sampleRateMatch[1] : "";

      // Extract channels (e.g. "5.1", "stereo", "mono", "7.1", "6 channels")
      const channelsMatch = line.match(
        /(stereo|mono|5\.1(?:\(side\))?|7\.1|2\s*channels|6\s*channels)/i,
      );
      const channels = channelsMatch
        ? channelsMatch[1].replace(/\(side\)/gi, "").trim()
        : "";

      // Extract bitrate (e.g. "640 kb/s")
      const bitrateMatch = line.match(/(\d+\s*kb\/s)/i);
      const bitrate = bitrateMatch ? bitrateMatch[1] : "";

      // Check if default stream
      const isDefault = /\(default\)/i.test(line);

      const langName = formatLanguage(rawLang);

      currentTrack = {
        audioIndex: audioIndex++,
        streamId,
        codec,
        language: rawLang,
        languageName: langName,
        title: "",
        sampleRate,
        channels,
        bitrate,
        isDefault,
      };

      tracks.push(currentTrack);
      continue;
    }

    // Capture metadata title line belonging to the current audio stream:
    // e.g., "    Metadata:" followed by "      title           : Japanese"
    if (currentTrack) {
      const titleMatch = line.match(/^\s*title\s*:\s*(.+)$/i);
      if (titleMatch && !currentTrack.title) {
        currentTrack.title = titleMatch[1].trim();
      }

      // If we reach a new non-audio stream or section, detach currentTrack
      if (/Stream #\d+:\d+/i.test(line) && !/Audio:/i.test(line)) {
        currentTrack = null;
      }
    }
  }

  // Construct user-friendly display labels for each track
  return tracks.map((track) => {
    const parts = [];
    const displayName = track.title || track.languageName || (track.language ? `[${track.language}]` : "");
    if (displayName) parts.push(displayName);

    const codecUpper = track.codec.toUpperCase();
    const details = [];
    if (track.channels) details.push(track.channels);
    if (track.sampleRate) details.push(track.sampleRate);
    if (track.bitrate) details.push(track.bitrate);

    const detailStr = details.length > 0 ? ` (${details.join(", ")})` : "";
    const label = `Track ${track.audioIndex + 1}: ${parts.length > 0 ? `${parts.join(" - ")} — ` : ""}${codecUpper}${detailStr}${track.isDefault ? " [Default]" : ""}`;

    return {
      ...track,
      label,
    };
  });
}
