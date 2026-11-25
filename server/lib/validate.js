import net from 'net'

const MAX_URL_LENGTH = 2048
// yt-dlp format selectors: ids, "+", "/", comparison filters, etc.
const FORMAT_RE = /^[A-Za-z0-9_\-+./[\]<>=,]{1,128}$/

const PRIVATE_V4 = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./
]

function isPrivateHost(hostname) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return true
  }
  const ipVersion = net.isIP(host)
  if (ipVersion === 4) return PRIVATE_V4.some((re) => re.test(host))
  if (ipVersion === 6) return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')
  return false
}

/**
 * Returns a normalised http(s) URL string, or null when the input is unusable.
 * Rejects non-http schemes and private/loopback hosts so the server cannot be
 * used to probe its own network.
 */
export function parseMediaUrl(raw) {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null

  let parsed
  try {
    parsed = new URL(trimmed)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
  if (!parsed.hostname || isPrivateHost(parsed.hostname)) return null
  return parsed.href
}

export function isValidFormat(format) {
  return typeof format === 'string' && FORMAT_RE.test(format)
}

/** Turns a media title into a filename that is safe on every common OS. */
export function toSafeFilename(title, fallback = 'video') {
  const cleaned = String(title ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, '_')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.]+|[\s.]+$/g, '')
    .slice(0, 120)
    .trim()
  return cleaned || fallback
}
