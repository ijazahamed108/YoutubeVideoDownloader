import { useState } from 'react'
import { ImageOff, ExternalLink } from 'lucide-react'

const formatViews = (count) => (typeof count === 'number' ? count.toLocaleString() : 'Unknown')

const MediaInfoCard = ({ info, compact = false }) => {
  const [thumbFailed, setThumbFailed] = useState(false)

  return (
    <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
      {!compact && (
        <div className="w-full h-48 rounded-lg bg-gray-100 overflow-hidden flex items-center justify-center">
          {info.thumbnail && !thumbFailed ? (
            <img
              src={info.thumbnail}
              alt={info.title}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setThumbFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-8 h-8 text-gray-400" />
          )}
        </div>
      )}
      <div className="min-w-0">
        {!compact && <h4 className="font-medium text-gray-900 mb-2 break-words">{info.title}</h4>}
        <dl className="text-sm text-gray-600 space-y-1">
          <div><dt className="inline font-medium">Duration:</dt> <dd className="inline">{info.duration}</dd></div>
          <div><dt className="inline font-medium">Uploader:</dt> <dd className="inline">{info.uploader || 'Unknown'}</dd></div>
          <div><dt className="inline font-medium">Views:</dt> <dd className="inline">{formatViews(info.view_count)}</dd></div>
          {info.upload_date && (
            <div><dt className="inline font-medium">Uploaded:</dt> <dd className="inline">{info.upload_date}</dd></div>
          )}
        </dl>
        {info.webpage_url && (
          <a
            href={info.webpage_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
          >
            Open original <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

export default MediaInfoCard
