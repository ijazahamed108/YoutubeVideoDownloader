import { useEffect, useState } from 'react'
import { fetchHealth } from '../api/client'

/** Checks once on mount whether the backend and its tools are available. */
export function useServerHealth() {
  const [health, setHealth] = useState({ checked: false, reachable: true, ok: true, ffmpeg: true })

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then((data) => !cancelled && setHealth({ checked: true, reachable: true, ok: data.ok, ffmpeg: data.ffmpeg }))
      .catch(() => !cancelled && setHealth({ checked: true, reachable: false, ok: false, ffmpeg: false }))
    return () => {
      cancelled = true
    }
  }, [])

  return health
}
