import { Download, Loader2 } from 'lucide-react'

const formatTypeStyles = {
  combined: {
    container: 'border-purple-200 bg-purple-50',
    badge: 'bg-purple-100 text-purple-800',
    label: 'Video+Audio'
  },
  video: {
    container: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
    label: 'Video'
  },
  audio: {
    container: 'border-green-200 bg-green-50',
    badge: 'bg-green-100 text-green-800',
    label: 'Audio'
  }
}

const FormatSelector = ({
  formats,
  selectedFormat,
  onSelectFormat,
  onDownload,
  isDownloading,
  downloadProgress,
  downloadStatus,
  name = 'format'
}) => {
  if (!formats.length) return null

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-3">Available Formats & Qualities</h4>
      <div className="grid gap-2 mb-4 max-h-80 overflow-y-auto">
        {formats.map((format) => {
          const styles = formatTypeStyles[format.type] || formatTypeStyles.video

          return (
            <label
              key={format.format_id}
              className={`flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${styles.container}`}
            >
              <input
                type="radio"
                name={name}
                value={format.format_id}
                checked={selectedFormat === format.format_id}
                onChange={(e) => onSelectFormat(e.target.value)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-1 text-xs rounded ${styles.badge}`}>
                    {styles.label}
                  </span>
                  <span className="font-medium">{format.quality}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {format.ext} • {format.filesize ? `${(format.filesize / 1024 / 1024).toFixed(1)} MB` : 'Size unknown'}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {isDownloading && downloadProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{downloadStatus || 'Download Progress'}</span>
            <span>{downloadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      <button
        onClick={onDownload}
        disabled={!selectedFormat || isDownloading}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {isDownloading ? 'Downloading...' : 'Download Selected Format'}
      </button>
    </div>
  )
}

export default FormatSelector
