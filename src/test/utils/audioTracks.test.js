import { describe, it, expect } from "vitest";
import {
  parseAudioStreams,
  formatLanguage,
  getRecommendedFormatForCodec,
} from "../../utils/audioTracks";

describe("audioTracks utilities", () => {
  it("formats ISO-639 language codes correctly", () => {
    expect(formatLanguage("eng")).toBe("English");
    expect(formatLanguage("jpn")).toBe("Japanese");
    expect(formatLanguage("spa")).toBe("Spanish");
    expect(formatLanguage("und")).toBe("");
    expect(formatLanguage("")).toBe("");
  });

  it("maps audio codecs to recommended lossless extensions", () => {
    expect(getRecommendedFormatForCodec("eac3")).toBe("eac3");
    expect(getRecommendedFormatForCodec("ac3")).toBe("ac3");
    expect(getRecommendedFormatForCodec("aac")).toBe("m4a");
    expect(getRecommendedFormatForCodec("opus")).toBe("opus");
    expect(getRecommendedFormatForCodec("flac")).toBe("flac");
    expect(getRecommendedFormatForCodec("mp3")).toBe("mp3");
    expect(getRecommendedFormatForCodec("vorbis")).toBe("ogg");
    expect(getRecommendedFormatForCodec("unknown", "mkv")).toBe("mka");
  });

  it("correctly parses dual audio tracks from FFmpeg log lines (e.g. MKV Dual Audio)", () => {
    const sampleLogs = [
      "Input #0, matroska,webm, from 'aa.S01E01.mkv':",
      "  Metadata:",
      "    title           : aa.S01E01.1080p.Dual.Audio.WEBRip.DD+.x265-EMBER",
      "  Duration: 01:11:00.00, start: 0.000000, bitrate: 2637 kb/s",
      "  Stream #0:0(eng): Video: hevc (Main 10), yuv420p10le, 1920x1080, 23.98 fps",
      "  Stream #0:1(eng): Audio: eac3, 48000 Hz, 5.1(side), fltp, 640 kb/s (default)",
      "    Metadata:",
      "      title           : English",
      "  Stream #0:2(jpn): Audio: eac3, 48000 Hz, 5.1(side), fltp, 640 kb/s",
      "    Metadata:",
      "      title           : Japanese",
      "  Stream #0:3(eng): Subtitle: subrip",
    ];

    const tracks = parseAudioStreams(sampleLogs);

    expect(tracks).toHaveLength(2);

    expect(tracks[0].audioIndex).toBe(0);
    expect(tracks[0].streamId).toBe(1);
    expect(tracks[0].codec).toBe("eac3");
    expect(tracks[0].language).toBe("eng");
    expect(tracks[0].languageName).toBe("English");
    expect(tracks[0].title).toBe("English");
    expect(tracks[0].channels).toBe("5.1");
    expect(tracks[0].sampleRate).toBe("48000 Hz");
    expect(tracks[0].isDefault).toBe(true);
    expect(tracks[0].label).toContain("Track 1");
    expect(tracks[0].label).toContain("English");
    expect(tracks[0].label).toContain("EAC3");
    expect(tracks[0].label).toContain("[Default]");

    expect(tracks[1].audioIndex).toBe(1);
    expect(tracks[1].streamId).toBe(2);
    expect(tracks[1].codec).toBe("eac3");
    expect(tracks[1].language).toBe("jpn");
    expect(tracks[1].languageName).toBe("Japanese");
    expect(tracks[1].title).toBe("Japanese");
    expect(tracks[1].channels).toBe("5.1");
    expect(tracks[1].isDefault).toBe(false);
    expect(tracks[1].label).toContain("Track 2");
    expect(tracks[1].label).toContain("Japanese");
    expect(tracks[1].label).toContain("EAC3");
  });

  it("handles video files with zero audio tracks", () => {
    const silentLogs = [
      "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from 'silent.mp4':",
      "  Duration: 00:00:10.00, start: 0.000000, bitrate: 500 kb/s",
      "  Stream #0:0: Video: h264 (High), yuv420p, 1280x720, 30 fps",
    ];

    const tracks = parseAudioStreams(silentLogs);
    expect(tracks).toHaveLength(0);
  });
});
