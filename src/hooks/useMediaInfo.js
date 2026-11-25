import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMediaInfo, getErrorMessage } from '../api/client'

const EMPTY = { info: null, formats: [], streamUrl: null }

/**
 * Owns the URL input and the analysed media result. A new analyse cancels any
 * in-flight request so stale responses can never overwrite newer ones.
 */
export function useMediaInfo() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(EMPTY)
  const controllerRef = useRef(null)

  useEffect(() => () => controllerRef.current?.abort(), [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    setResult(EMPTY)
    setError('')
    setLoading(false)
  }, [])

  const analyze = useCallback(async () => {
    const target = url.trim()
    if (!target) return

    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setLoading(true)
    setError('')
    setResult(EMPTY)

    try {
      const data = await fetchMediaInfo(target, controller.signal)
      if (controller.signal.aborted) return
      setResult({ info: data.info, formats: data.formats || [], streamUrl: data.streamUrl || null })
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to fetch video information')
      if (message) setError(message)
    } finally {
      if (controllerRef.current === controller) setLoading(false)
    }
  }, [url])

  return { url, setUrl, loading, error, ...result, analyze, reset }
}
