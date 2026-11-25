import { Download, Play } from 'lucide-react'
import Alert from './Alert'
import FormatSelector from './FormatSelector'
import MediaInfoCard from './MediaInfoCard'
import PreviewPlayer from './PreviewPlayer'
import UrlForm from './UrlForm'

const MODES = {
  download: {
    heading: 'Download Video',
    label: 'Video URL',
    placeholder: 'Paste a YouTube, Facebook, Instagram or other video URL...',
    buttonLabel: 'Analyze',
    ButtonIcon: Download
  },
  preview: {
    heading: 'Preview Media',
    label: 'Media URL',
    placeholder: 'Paste a URL to preview video or audio...',
    buttonLabel: 'Load',
    ButtonIcon: Play
  }
}

/**
 * The shared workspace for both tabs. State lives in App so switching tabs
 * keeps the analysed media and any in-progress download.
 */
const MediaPanel = ({ mode, media, download, selectedFormat, onSelectFormat }) => {
  const copy = MODES[mode]
  const { info, formats, streamUrl } = media

  const handleDownload = () => {
    if (!selectedFormat || !info) return
    download.start({ url: media.url.trim(), format: selectedFormat, title: info.title })
  }

  const handleClear = () => {
    media.setUrl('')
    media.reset()
    onSelectFormat('')
    if (!download.isActive) download.reset()
  }

  const errorMessage = media.error || download.error

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">{copy.heading}</h2>
        <div className="space-y-4">
          <UrlForm
            label={copy.label}
            value={media.url}
            onChange={media.setUrl}
            onSubmit={() => {
              onSelectFormat('')
              media.analyze()
            }}
            onClear={handleClear}
            loading={media.loading}
            placeholder={copy.placeholder}
            buttonLabel={copy.buttonLabel}
            ButtonIcon={copy.ButtonIcon}
          />

          {errorMessage && <Alert variant="error">{errorMessage}</Alert>}
          {download.status === 'done' && <Alert variant="success">{download.message}</Alert>}
        </div>
      </section>

      {info && (
        <section className="bg-white rounded-lg shadow p-6 space-y-6">
          {mode === 'preview' ? (
            <>
              <h3 className="text-lg font-semibold break-words">{info.title}</h3>
              <PreviewPlayer info={info} streamUrl={streamUrl} />
              <MediaInfoCard info={info} compact />
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold">Video Information</h3>
              <MediaInfoCard info={info} />
            </>
          )}

          <FormatSelector
            formats={formats}
            selectedFormat={selectedFormat}
            onSelectFormat={onSelectFormat}
            onDownload={handleDownload}
            onCancel={download.cancel}
            download={download}
            name={`${mode}-format`}
          />
        </section>
      )}
    </div>
  )
}

export default MediaPanel
