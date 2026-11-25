import { useMemo, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'

const TYPE_STYLES = {
  combined: { container: 'border-purple-200 bg-purple-50', badge: 'bg-purple-100 text-purple-800', label: 'Video+Audio' },
  video: { container: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-800', label: 'Video' },
  audio: { container: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-800', label: 'Audio' }
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'combined', label: 'Video + Audio' },
  { id: 'video', label: 'Video' },
  { id: 'audio', label: 'Audio' }
]

const formatSize = (bytes) => {
  if (!bytes) return 'Size unknown'
  const mb = bytes / 1024 / 1024
  if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const FormatSelector = ({
  formats,
  selectedFormat,
  onSelectFormat,
  onDownload,
  onCancel,
  download,
  name = 'format'
}) => {
  const [filter, setFilter] = useState('all')

  const availableFilters = useMemo(
    () => FILTERS.filter((f) => f.id === 'all' || formats.some((fmt) => fmt.type === f.id)),
    [formats]
  )
  const visible = useMemo(
    () => (filter === 'all' ? formats : formats.filter((f) => f.type === filter)),
    [formats, filter]
  )

  if (!formats.length) {
    return <p className="text-sm text-gray-500">No downloadable formats were found for this media.</p>
  }

  const busy = download.isActive

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="font-medium text-gray-900">Available Formats &amp; Qualities</h4>
        {availableFilters.length > 2 && (
          <div className="flex gap-1" role="tablist" aria-label="Filter formats">
            {availableFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                  filter === f.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-2 mb-4 max-h-80 overflow-y-auto pr-1">
        {visible.map((format) => {
          const styles = TYPE_STYLES[format.type] || TYPE_STYLES.video
          const checked = selectedFormat === format.format_id
          return (
            <label
              key={format.format_id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-shadow ${styles.container} ${
                checked ? 'ring-2 ring-blue-500' : 'hover:shadow-sm'
              } ${busy ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <input
                type="radio"
                name={name}
                value={format.format_id}
                checked={checked}
                disabled={busy}
                onChange={(e) => onSelectFormat(e.target.value)}
                className="mr-3"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 text-xs rounded ${styles.badge}`}>{styles.label}</span>
                  <span className="font-medium">{format.quality}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {format.ext} • {formatSize(format.filesize)}
                </div>
              </div>
            </label>
          )
        })}
      </div>

      {busy && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{download.message}</span>
            <span>{download.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${download.status === 'starting' ? 'bg-blue-400 animate-pulse w-full' : 'bg-blue-600'}`}
              style={download.status === 'starting' ? undefined : { width: `${download.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDownload}
          disabled={!selectedFormat || busy}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {busy ? 'Downloading...' : 'Download Selected Format'}
        </button>
        {busy && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default FormatSelector
