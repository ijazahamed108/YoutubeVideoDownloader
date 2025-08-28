import { useState } from 'react'
import axios from 'axios'
import { Play, Loader2, AlertCircle } from 'lucide-react'

const MediaPlayer = () => {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [mediaInfo, setMediaInfo] = useState(null)
  const [error, setError] = useState('')
  const [streamUrl, setStreamUrl] = useState('')

  const loadMedia = async () => {
    if (!url.trim()) return
    
    setLoading(true)
    setError('')
    setMediaInfo(null)
    setStreamUrl('')
    
    try {
      const response = await axios.post('/api/stream-info', { url })
      setMediaInfo(response.data.info)
      setStreamUrl(response.data.streamUrl)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load media')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Preview Media</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadMedia()}
                placeholder="Paste URL to preview video/audio..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={loadMedia}
                disabled={loading || !url.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Load
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      </div>

      {mediaInfo && streamUrl && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">{mediaInfo.title}</h3>
          
          <div className="space-y-4">
            {mediaInfo.vcodec !== 'none' ? (
              <video
                controls
                className="w-full max-h-96 rounded-lg"
                poster={mediaInfo.thumbnail}
              >
                <source src={streamUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="space-y-4">
                <img
                  src={mediaInfo.thumbnail}
                  alt={mediaInfo.title}
                  className="w-full max-h-64 object-cover rounded-lg"
                />
                <audio controls className="w-full">
                  <source src={streamUrl} type="audio/mpeg" />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Duration:</strong> {mediaInfo.duration}</p>
                <p><strong>Uploader:</strong> {mediaInfo.uploader}</p>
              </div>
              <div>
                <p><strong>Views:</strong> {mediaInfo.view_count?.toLocaleString()}</p>
                <p><strong>Upload Date:</strong> {mediaInfo.upload_date}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaPlayer