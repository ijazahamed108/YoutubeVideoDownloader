import { useCallback, useEffect, useRef, useState } from 'react'
import { cancelDownload, downloadFileUrl, getDownloadStatus, getErrorMessage, startDownload } from '../api/client'

const POLL_MS = 750
const DONE_RESET_MS = 6000

const IDLE = { status: 'idle', progress: 0, message: '', error: '' }

const MESSAGES = {
  starting: 'Starting download...',
  downloading: 'Downloading on server...',
  processing: 'Merging and finalising...',
  done: 'Download started. Check your browser downloads.'
}

function saveFile(jobId) {
  const link = document.createElement('a')
  link.href = downloadFileUrl(jobId)
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/**
 * Drives a server-side download job: start → poll progress → hand the finished
 * file to the browser's own download manager (no in-memory blob).
 */
export function useDownload() {
  const [state, setState] = useState(IDLE)
  const jobRef = useRef(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimer()
    }
  }, [])

  const update = (patch) => mountedRef.current && setState((prev) => ({ ...prev, ...patch }))

  const poll = useCallback(async (jobId) => {
    if (jobRef.current !== jobId) return
    try {
      const job = await getDownloadStatus(jobId)
      if (jobRef.current !== jobId) return

      if (job.status === 'ready') {
        saveFile(jobId)
        update({ status: 'done', progress: 100, message: MESSAGES.done })
        jobRef.current = null
        timerRef.current = setTimeout(() => update(IDLE), DONE_RESET_MS)
        return
      }
      if (job.status === 'error' || job.status === 'cancelled') {
        update({ status: 'error', progress: 0, message: '', error: job.error || 'Download failed' })
        jobRef.current = null
        return
      }
      update({ status: job.status, progress: job.progress, message: MESSAGES[job.status] || MESSAGES.downloading })
      timerRef.current = setTimeout(() => poll(jobId), POLL_MS)
    } catch (err) {
      if (jobRef.current !== jobId) return
      update({ status: 'error', progress: 0, message: '', error: getErrorMessage(err, 'Lost contact with the download') })
      jobRef.current = null
    }
  }, [])

  const start = useCallback(async ({ url, format, title }) => {
    if (jobRef.current) return
    clearTimer()
    update({ status: 'starting', progress: 0, message: MESSAGES.starting, error: '' })
    try {
      const job = await startDownload({ url, format, title })
      jobRef.current = job.id
      timerRef.current = setTimeout(() => poll(job.id), POLL_MS)
    } catch (err) {
      update({ status: 'error', progress: 0, message: '', error: getErrorMessage(err, 'Download failed') })
    }
  }, [poll])

  const cancel = useCallback(async () => {
    const jobId = jobRef.current
    jobRef.current = null
    clearTimer()
    update(IDLE)
    if (jobId) await cancelDownload(jobId)
  }, [])

  const reset = useCallback(() => {
    clearTimer()
    update(IDLE)
  }, [])

  const isActive = ['starting', 'downloading', 'processing'].includes(state.status)

  return { ...state, isActive, start, cancel, reset }
}
