import axios from 'axios'

export async function triggerVideoDownload({
  url,
  formatId,
  formats,
  title,
  onProgress,
  onStatus
}) {
  onStatus?.('Preparing download...')

  const response = await axios.post('/api/download', {
    url,
    format: formatId
  }, {
    responseType: 'blob',
    onDownloadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress?.(progress)
        onStatus?.(`Downloading... ${progress}%`)
      }
    }
  })

  onStatus?.('Processing file...')
  onProgress?.(100)

  const selectedFormat = formats.find(f => f.format_id === formatId)
  const extension = selectedFormat?.ext || 'mp4'
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_')

  const blob = new Blob([response.data])
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `${safeTitle}.${extension}`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(downloadUrl)
}
