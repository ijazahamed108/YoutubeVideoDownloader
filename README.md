# Video Downloader

A React + Express application for downloading and previewing videos from YouTube, Facebook, Instagram and any other site supported by [yt-dlp](https://github.com/yt-dlp/yt-dlp).

## Features

- **Multi-platform support** powered by yt-dlp
- **Quality selection** with video+audio, video-only (auto-merged) and audio-only options, filterable by type
- **In-app preview** streamed through the server, with seeking support
- **Server-side downloads** with live progress, cancel, and hand-off to the browser's download manager (no large blobs held in memory)
- **Clear error messages** (private video, age-restricted, rate limited, missing ffmpeg, ...)
- **Health banner** that tells you when the backend, yt-dlp or ffmpeg is missing

## Prerequisites

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp#installation) (`brew install yt-dlp` or `pip3 install yt-dlp`)
- [ffmpeg](https://ffmpeg.org/) (optional, required for merged high-resolution formats)

## Quick start

```bash
./start.sh
```

This installs dependencies (and yt-dlp if missing) and starts both servers:

- Frontend: http://localhost:5173/YoutubeVideoDownloader/
- Backend API: http://localhost:3001

### Manual start

```bash
npm install && (cd server && npm install)
npm run dev:server   # terminal 1
npm run dev          # terminal 2
```

### Docker

```bash
docker compose up --build
```

The container bundles yt-dlp and ffmpeg and serves the built frontend from http://localhost:3001.

## Configuration

Backend environment variables:

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3001` | HTTP port |
| `YT_DLP_PATH` | auto-detected | Explicit path to the yt-dlp binary |
| `FFMPEG_PATH` | auto-detected | Explicit path to ffmpeg |
| `YT_DLP_EXTRA_ARGS` | – | Extra flags passed to every yt-dlp call, e.g. `--cookies /path/cookies.txt` |
| `MAX_CONCURRENT_DOWNLOADS` | `3` | Cap on simultaneous download jobs |
| `INFO_TIMEOUT_MS` | `60000` | Timeout for metadata extraction |
| `CORS_ORIGIN` | any | Comma-separated list of allowed origins |
| `TRUST_PROXY` | – | Set to `1` behind a reverse proxy so rate limiting sees real client IPs |

Frontend build:

| Variable | Default | Description |
| --- | --- | --- |
| `BASE_PATH` | `/YoutubeVideoDownloader/` | Public base path (GitHub Pages). Docker builds with `/`. |

## API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Server, yt-dlp and ffmpeg status |
| `POST` | `/api/video-info` | `{ url }` → metadata, formats and a preview stream URL |
| `GET` | `/api/preview/:token` | Range-capable proxy for the preview stream |
| `POST` | `/api/download` | `{ url, format, title }` → starts a job, returns `{ id, status, progress }` |
| `GET` | `/api/download/:id` | Poll job progress |
| `GET` | `/api/download/:id/file` | Stream the finished file (`Content-Disposition: attachment`) |
| `DELETE` | `/api/download/:id` | Cancel a job and delete its temp files |

Downloaded files live in the OS temp directory and are removed shortly after being served, on cancel, on shutdown, or after 30 minutes.

## Project layout

```
server/
  server.js          Express app, routes, static serving
  lib/ytdlp.js       Binary detection, safe spawning, error translation
  lib/downloads.js   Download job manager (temp dirs, progress, cleanup)
  lib/formats.js     Format list shaping and preview selection
  lib/validate.js    URL / format / filename validation
  lib/cache.js       TTL cache and rate limiter
src/
  api/client.js      Typed API helpers
  hooks/             useMediaInfo, useDownload, useServerHealth
  components/        UI building blocks (MediaPanel is the shared tab body)
```

## Technology stack

React 18, Vite, Tailwind CSS, Lucide icons, Express, yt-dlp, ffmpeg, Docker.

## License

MIT
