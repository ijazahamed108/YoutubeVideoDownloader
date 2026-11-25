#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"

echo "Starting Video Downloader"

install_ytdlp() {
    echo "Installing yt-dlp..."
    if command -v brew &> /dev/null; then
        brew install yt-dlp
    elif command -v pipx &> /dev/null; then
        pipx install yt-dlp
    else
        pip3 install --user yt-dlp || pip3 install yt-dlp --break-system-packages
    fi
}

command -v yt-dlp &> /dev/null || install_ytdlp
if ! command -v ffmpeg &> /dev/null; then
    echo "Warning: ffmpeg not found. Merged (video-only + audio) formats will be hidden."
    echo "         Install it with: brew install ffmpeg  (or your package manager)"
fi

[ -d node_modules ] || { echo "Installing frontend dependencies..."; npm install; }
[ -d server/node_modules ] || { echo "Installing backend dependencies..."; (cd server && npm install); }

echo "Frontend: http://localhost:5173/YoutubeVideoDownloader/"
echo "Backend:  http://localhost:3001"

# Stop both processes together on Ctrl+C.
trap 'kill 0' EXIT INT TERM

(cd server && npm run dev) &
npm run dev &
wait
