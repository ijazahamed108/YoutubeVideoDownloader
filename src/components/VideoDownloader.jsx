import { useState } from 'react'
import axios from 'axios'
import { Download, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

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
    if (!selectedFormat) return
    
    setIsDownloading(true)
    setDownloadProgress(0)
    setDownloadStatus('Preparing download...')
    setError('')
    
    try {
      // Start download with progress tracking
      const downloadPromise = axios.post('/api/download', {
        url,
        format: selectedFormat
      }, {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setDownloadProgress(progress)
            setDownloadStatus(`Downloading... ${progress}%`)
          }
        }
      })
      
      const response = await downloadPromise
      
      setDownloadStatus('Processing file...')
      setDownloadProgress(100)
      
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      
      // Get file extension from selected format
      const selectedFormatObj = formats.find(f => f.format_id === selectedFormat)
      const extension = selectedFormatObj?.ext || 'mp4'
      
      link.download = `${videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      setDownloadStatus('Download completed! ✅')
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

          {downloadStatus && (
            <div className={`flex items-center gap-2 p-3 rounded-md ${
              downloadStatus.includes('completed') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
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

          {formats.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Select Format & Quality</h4>
              <div className="grid gap-2 mb-4">
                {formats.map((format, index) => (
                  <label key={index} className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    format.type === 'combined' ? 'border-purple-200 bg-purple-50' :
                    format.type === 'video' ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'
                  }`}>
                    <input
                      type="radio"
                      name="format"
                      value={format.format_id}
                      onChange={(e) => setSelectedFormat(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          format.type === 'combined' ? 'bg-purple-100 text-purple-800' :
                          format.type === 'video' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {format.type === 'combined' ? '🎬 Video+Audio' :
                           format.type === 'video' ? '📹 Video' : '🎵 Audio'}
                        </span>
                        <span className="font-medium">{format.quality}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {format.ext} • {format.filesize ? `${(format.filesize / 1024 / 1024).toFixed(1)} MB` : 'Size unknown'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {isDownloading && downloadProgress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Download Progress</span>
                    <span>{downloadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
              
              <button
                onClick={downloadVideo}
                disabled={!selectedFormat || isDownloading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'Downloading...' : 'Download Selected Format'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VideoDownloader