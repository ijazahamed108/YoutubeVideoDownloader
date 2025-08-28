#!/bin/bash

echo "🚀 Starting Video Downloader Application"

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "📦 Installing yt-dlp..."
    pip3 install yt-dlp
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

# Start the application
echo "🎬 Starting the application..."
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API will be available at: http://localhost:3001"

# Start backend in background
cd server
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID