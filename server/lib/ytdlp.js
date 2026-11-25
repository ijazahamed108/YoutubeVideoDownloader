import { spawn, execFile } from 'child_process'
import { promisify } from 'util'
import os from 'os'

const execFileAsync = promisify(execFile)

export class YtDlpError extends Error {
  constructor(message, status = 422, details = '') {
    super(message)
    this.name = 'YtDlpError'
    this.status = status
    this.details = details
  }
}

/**
 * Arguments shared by every yt-dlp invocation. Extra flags can be injected via
 * the YT_DLP_EXTRA_ARGS env var (whitespace separated), e.g. to point at a
 * cookies file or tweak extractor args without a code change.
 */
export function buildBaseArgs() {
  const extra = (process.env.YT_DLP_EXTRA_ARGS || '').split(/\s+/).filter(Boolean)
  return [
    '--no-playlist',
    '--no-warnings',
    '--no-colors',
    '--socket-timeout', '30',
    '--retries', '3',
    // Keep yt-dlp's default player clients; pinning e.g. "android" now yields
    // SABR-only streams without URLs. Override via YT_DLP_EXTRA_ARGS if needed.
    ...extra
  ]
}

async function probe(binary, args = ['--version']) {
  try {
    const { stdout } = await execFileAsync(binary, args, { timeout: 10_000 })
    return stdout.trim().split('\n')[0]
  } catch {
    return null
  }
}

async function resolveBinary(candidates, versionArgs) {
  for (const candidate of candidates) {
    const version = await probe(candidate, versionArgs)
    if (version !== null) return { path: candidate, version }
  }
  return null
}

/** Locates yt-dlp and ffmpeg. Explicit env paths always win. */
export async function detectTools() {
  const home = os.homedir()
  const pythonBins = ['3.13', '3.12', '3.11', '3.10', '3.9'].map(
    (v) => `${home}/Library/Python/${v}/bin/yt-dlp`
  )

  const ytDlp = await resolveBinary(
    [
      process.env.YT_DLP_PATH,
      'yt-dlp',
      '/opt/homebrew/bin/yt-dlp',
      '/usr/local/bin/yt-dlp',
      `${home}/.local/bin/yt-dlp`,
      ...pythonBins
    ].filter(Boolean),
    ['--version']
  )

  // ffmpeg only understands the single-dash form.
  const ffmpeg = await resolveBinary(
    [process.env.FFMPEG_PATH, 'ffmpeg', '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg'].filter(Boolean),
    ['-version']
  )

  return { ytDlp, ffmpeg }
}

const ERROR_HINTS = [
  [/unsupported url/i, 'This URL is not supported.'],
  [/private video|video is private/i, 'This video is private.'],
  [/members[- ]only|join this channel/i, 'This video is for channel members only.'],
  [/sign in to confirm|age[- ]restricted|confirm your age/i, 'This video requires sign-in (age-restricted or bot check).'],
  [/video unavailable|is not available|has been removed|does not exist/i, 'This video is unavailable.'],
  [/requested format is not available/i, 'The selected format is no longer available. Re-analyse the URL and pick again.'],
  [/ffmpeg|ffprobe/i, 'ffmpeg is required for this format but is not installed on the server.'],
  [/http error 429|too many requests/i, 'The video site is rate limiting this server. Try again in a few minutes.'],
  [/http error 403/i, 'The video site refused access (403). Try again or pick another format.'],
  [/unable to download webpage|name or service not known|network is unreachable|timed out/i, 'Could not reach the video site. Check the URL and network connection.'],
  [/is not a valid url/i, 'That does not look like a valid URL.']
]

/** Converts raw yt-dlp stderr into a short message suitable for end users. */
export function friendlyError(stderr) {
  const lines = String(stderr || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const errorLine = [...lines].reverse().find((l) => /^ERROR:/i.test(l)) || lines[lines.length - 1] || ''

  for (const [pattern, message] of ERROR_HINTS) {
    if (pattern.test(errorLine)) return message
  }

  const cleaned = errorLine
    .replace(/^ERROR:\s*/i, '')
    .replace(/^\[[^\]]+\]\s*[\w-]*:\s*/, '') // strip "[youtube] abc123: " prefix
    .trim()

  return cleaned ? cleaned.slice(0, 200) : 'yt-dlp could not process this URL.'
}

/**
 * Runs yt-dlp with an argument array (never a shell string) and collects
 * stdout. Rejects with YtDlpError on non-zero exit or timeout.
 */
export function runYtDlp(binary, args, { timeoutMs = 60_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []
    const stderr = []
    let timedOut = false

    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeoutMs)

    child.stdout.on('data', (chunk) => stdout.push(chunk))
    child.stderr.on('data', (chunk) => stderr.push(chunk))

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(new YtDlpError('yt-dlp is not available on the server.', 503, err.message))
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      const errText = Buffer.concat(stderr).toString()
      if (timedOut) {
        return reject(new YtDlpError('Timed out while contacting the video site.', 504, errText))
      }
      if (code !== 0) {
        return reject(new YtDlpError(friendlyError(errText), 422, errText))
      }
      resolve(Buffer.concat(stdout).toString())
    })
  })
}
