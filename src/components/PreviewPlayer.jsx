import { useEffect, useState } from 'react'
import { VideoOff } from 'lucide-react'
import Alert from './Alert'

const PreviewPlayer = ({ info, streamUrl }) => {
  const [failed, setFailed] = useState(false)

  useEffect(() => setFailed(false), [streamUrl])

  if (!streamUrl) {
    return (
      <div className="w-full h-56 rounded-lg bg-gray-100 flex flex-col items-center justify-center text-gray-500 gap-2">
        <VideoOff className="w-8 h-8" />
        <span className="text-sm">No in-browser preview is available for this media.</span>
      </div>
    )
  }

  if (failed) {
    return (
      <Alert variant="warning">
        The preview stream could not be played in your browser. You can still download the file below.
      </Alert>
    )
  }

  if (info.previewKind === 'audio') {
    return (
      <div className="space-y-4">
        {info.thumbnail && (
          <img src={info.thumbnail} alt={info.title} loading="lazy" referrerPolicy="no-referrer" className="w-full max-h-64 object-cover rounded-lg" />
        )}
        <audio key={streamUrl} controls preload="metadata" className="w-full" onError={() => setFailed(true)}>
          <source src={streamUrl} type={info.previewMime || 'audio/mp4'} />
        </audio>
      </div>
    )
  }

  return (
    <video
      key={streamUrl}
      controls
      playsInline
      preload="metadata"
      poster={info.thumbnail || undefined}
      className="w-full max-h-96 rounded-lg bg-black"
      onError={() => setFailed(true)}
    >
      <source src={streamUrl} type={info.previewMime || 'video/mp4'} />
    </video>
  )
}

export default PreviewPlayer
