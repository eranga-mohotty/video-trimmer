# 🎬 Video Trimmer

A fast, lightweight, and privacy-first web application to trim video clips directly in your browser using **FFmpeg WebAssembly** (`ffmpeg.wasm`). 

No video uploads, no backend servers, and no data tracking — all video processing is performed 100% locally on your machine.

[![Live Demo](https://img.shields.io/badge/demo-online-green.svg)](https://eranga-mohotty.github.io/video-trimmer/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![FFmpeg.wasm](https://img.shields.io/badge/FFmpeg.wasm-v0.12-0078D7.svg)](https://github.com/ffmpegwasm/ffmpeg.wasm)

🌐 **[Try the Live Demo](https://eranga-mohotty.github.io/video-trimmer/)**

---

## ✨ Features

- 🔒 **100% Client-Side & Private**: Your videos never leave your browser. Zero server uploads and zero privacy concerns.
- ⚡ **Fast Lossless Trimming**: Uses FFmpeg stream copy (`-c copy`) mode to cut videos without re-encoding, preserving original quality and finishing in seconds.
- 📊 **Real-Time Visual Progress Indicator**: Live progress bar with stage descriptions (*Loading into memory*, *Trimming*, *Preparing preview*) and percentage completion.
- 🎬 **Instant In-Browser Previews**: Built-in video players to preview both the original source video and the trimmed result before saving.
- 💾 **Direct Download**: One-click download button for saving the trimmed output file with clear naming.
- 🌙 **Modern Dark UI**: Clean, responsive layout crafted with React and Tailwind CSS.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Media Engine**: [@ffmpeg/ffmpeg](https://github.com/ffmpegwasm/ffmpeg.wasm) & [@ffmpeg/util](https://github.com/ffmpegwasm/util)
- **Deployment**: [GitHub Pages](https://pages.github.com/) via `gh-pages`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- `npm` (v9 or higher)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/eranga-mohotty/video-trimmer.git
   cd video-trimmer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Development

Run the development server locally:

```bash
npm run dev
```

Open your browser at `http://localhost:5173/video-trimmer/` to view the app.

### Production Build

Create an optimized production bundle:

```bash
npm run build
```

The compiled output will be available in the `dist/` directory.

### Deployment

Deploy directly to GitHub Pages:

```bash
npm run deploy
```

---

## 🧠 How It Works

1. **FFmpeg Initialization**: On first load, `@ffmpeg/ffmpeg` initializes a WebAssembly binary inside a dedicated Web Worker.
2. **Virtual In-Memory File System**: When you select a video, it is loaded into FFmpeg's virtual memory file system (MEMFS).
3. **Stream Copy Trimming**: FFmpeg runs the following command without re-encoding:
   ```bash
   ffmpeg -ss <start_time> -to <end_time> -i <input_file> -c copy <output_file>
   ```
4. **Progress Monitoring**: During processing, FFmpeg emits progress events that update the on-screen progress bar and status indicator in real-time.
5. **Memory Cleanup**: Virtual files and blob URLs are properly cleared after rendering the preview to keep memory usage low.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
