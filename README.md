# Video Downloader

A modern React application for downloading videos from YouTube, Facebook, Instagram, and other platforms with in-app preview capabilities.

## Features

- **Multi-platform Support**: Download from YouTube, Facebook, Instagram, and more
- **Quality Selection**: Choose from available video/audio quality options
- **In-app Preview**: Watch videos and listen to audio directly in the browser
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Download Management**: Easy-to-use download interface with progress feedback

## Prerequisites

- Node.js 18+
- Python 3.7+
- pip3

## Installation

### Local Development

1. **Install dependencies**:
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd server
   npm install
   cd ..
   ```

2. **Install yt-dlp**:
   ```bash
   pip3 install yt-dlp
   ```

3. **Start the application**:
   ```bash
   # Start backend (Terminal 1)
   cd server
   npm run dev
   
   # Start frontend (Terminal 2)
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Docker Deployment

1. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

2. **Access the application**:
   - Application: http://localhost:3001

## Usage

### Download Videos

1. Navigate to the "Download" tab
2. Paste a video URL (YouTube, Facebook, Instagram, etc.)
3. Click "Analyze" to fetch video information and available formats
4. Select your preferred quality/format
5. Click "Download Selected Quality"

### Preview Media

1. Navigate to the "Preview" tab
2. Paste a media URL
3. Click "Load" to preview the content directly in the browser

## Supported Platforms

- YouTube
- Facebook
- Instagram
- Twitter
- TikTok
- Vimeo
- And many more (powered by yt-dlp)

## API Endpoints

- `POST /api/video-info` - Get video information and available formats
- `POST /api/download` - Download video in selected format
- `POST /api/stream-info` - Get streaming URL for preview

## Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express
- **Video Processing**: yt-dlp
- **Deployment**: Docker, Docker Compose

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License