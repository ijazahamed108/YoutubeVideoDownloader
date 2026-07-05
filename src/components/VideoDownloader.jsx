import { useState } from 'react'
import axios from 'axios'
import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import FormatSelector from './FormatSelector'
import { triggerVideoDownload } from '../utils/videoDownload'

const VideoDownloader = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [formats, setFormats] = useState([])
  const [selectedFormat, setSelectedFormat] = useState('')
  const [videoInfo, setVideoInfo] = useState(null)
  const [error, setError] = useState('')
  const [downloadStatus, setDownloadStatus] = useState('')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  const fetchVideoInfo = async () => {
    if (!url.trim()) return
    
    setLoading(true)
    setError('')
    setFormats([])
    setVideoInfo(null)
    setSelectedFormat('')
    setDownloadStatus('')
    setDownloadProgress(0)
    
    try {
      const response = await axios.post('/api/video-info', { url })
      setVideoInfo(response.data.info)
      setFormats(response.data.formats)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch video information')
    } finally {
      setLoading(false)
    }
  }

  const downloadVideo = async () => {
    if (!selectedFormat || !videoInfo) return
    
    setIsDownloading(true)
    setDownloadProgress(0)
    setError('')

    try {
      await triggerVideoDownload({
        url,
        formatId: selectedFormat,
        formats,
        title: videoInfo.title,
        onProgress: setDownloadProgress,
        onStatus: setDownloadStatus
      })

      setDownloadStatus('Download completed!')
      setTimeout(() => {
        setDownloadStatus('')
        setDownloadProgress(0)
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Download failed')
      setDownloadStatus('')
      setDownloadProgress(0)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Download Video</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVideoInfo()}
                placeholder="Paste YouTube, Facebook, or Instagram URL here..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={fetchVideoInfo}
                disabled={loading || !url.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Analyze
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {downloadStatus && !isDownloading && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
              <CheckCircle className="w-4 h-4" />
              {downloadStatus}
            </div>
          )}
        </div>
      </div>

      {videoInfo && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Video Information</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                className="w-full h-48 object-cover rounded-lg"
              />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{videoInfo.title}</h4>
              <p className="text-sm text-gray-600 mb-2">Duration: {videoInfo.duration}</p>
              <p className="text-sm text-gray-600 mb-2">Uploader: {videoInfo.uploader}</p>
              <p className="text-sm text-gray-600">Views: {videoInfo.view_count?.toLocaleString()}</p>
            </div>
          </div>

          <FormatSelector
            formats={formats}
            selectedFormat={selectedFormat}
            onSelectFormat={setSelectedFormat}
            onDownload={downloadVideo}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            downloadStatus={downloadStatus}
            name="download-format"
          />
        </div>
      )}
    </div>
  )
}

export default VideoDownloader
