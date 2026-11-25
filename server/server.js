import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'
import { TtlCache, RateLimiter } from './lib/cache.js'
import { DownloadManager } from './lib/downloads.js'
import { buildFormats, pickPreview, formatDuration, formatUploadDate } from './lib/formats.js'
import { parseMediaUrl, isValidFormat } from './lib/validate.js'
import { buildBaseArgs, detectTools, runYtDlp, YtDlpError } from './lib/ytdlp.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT) || 3001
const DIST_DIR = path.resolve(__dirname, '../dist')
const INFO_TIMEOUT_MS = Number(process.env.INFO_TIMEOUT_MS) || 60_000
const MAX_CONCURRENT_DOWNLOADS = Number(process.env.MAX_CONCURRENT_DOWNLOADS) || 3

const tools = await detectTools()
if (!tools.ytDlp) {
  console.error('yt-dlp was not found. Install it (pip3 install yt-dlp / brew install yt-dlp) or set YT_DLP_PATH.')
} else {
  console.log(`yt-dlp ${tools.ytDlp.version} at ${tools.ytDlp.path}`)
}
if (!tools.ffmpeg) {
  console.warn('ffmpeg not found: merged (video-only + audio) formats will be hidden.')
}

const baseArgs = buildBaseArgs()
const infoCache = new TtlCache({ ttlMs: 5 * 60_000, maxEntries: 100 })
const previewUrls = new TtlCache({ ttlMs: 60 * 60_000, maxEntries: 200 })
const downloads = new DownloadManager({
  ytDlpPath: tools.ytDlp?.path,
  baseArgs,
  maxConcurrent: MAX_CONCURRENT_DOWNLOADS
})
const limiter = new RateLimiter({ windowMs: 60_000, max: 30 })

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', process.env.TRUST_PROXY === '1')
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined))
app.use(express.json({ limit: '16kb' }))

const requireYtDlp = (req, res, next) => {
  if (!tools.ytDlp) {
    return res.status(503).json({ error: 'yt-dlp is not installed on the server.' })
  }
  next()
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

app.get('/api/health', (req, res) => {
  res.json({
    ok: Boolean(tools.ytDlp),
    ytDlp: tools.ytDlp?.version || null,
    ffmpeg: Boolean(tools.ffmpeg),
    activeDownloads: downloads.activeCount
  })
})

app.post('/api/video-info', limiter.middleware(), requireYtDlp, asyncHandler(async (req, res) => {
  const url = parseMediaUrl(req.body?.url)
  if (!url) return res.status(400).json({ error: 'Please enter a valid http(s) video URL.' })

  const cached = infoCache.get(url)
  if (cached) return res.json(cached)

  const stdout = await runYtDlp(tools.ytDlp.path, ['-J', ...baseArgs, url], { timeoutMs: INFO_TIMEOUT_MS })
  const info = JSON.parse(stdout)
  const allFormats = info.formats || []
  const preview = pickPreview(allFormats, info)

  let streamUrl = null
  if (preview?.url) {
    // Hand the browser a same-origin URL; direct CDN links are IP-locked to
    // this server and often blocked by CORS.
    const token = randomUUID()
    previewUrls.set(token, preview.url)
    streamUrl = `/api/preview/${token}`
  }

  const payload = {
    info: {
      title: info.title || 'Untitled',
      thumbnail: info.thumbnail || null,
      duration: formatDuration(info.duration),
      uploader: info.uploader || info.channel || null,
      view_count: info.view_count ?? null,
      upload_date: formatUploadDate(info.upload_date),
      webpage_url: info.webpage_url || url,
      previewKind: preview?.kind || null,
      previewMime: preview?.mime || null
    },
    formats: buildFormats(allFormats, { ffmpegAvailable: Boolean(tools.ffmpeg) }),
    streamUrl
  }

  infoCache.set(url, payload)
  res.json(payload)
}))

// Proxies the preview stream with Range support so seeking works.
app.get('/api/preview/:token', asyncHandler(async (req, res) => {
  const upstreamUrl = previewUrls.get(req.params.token)
  if (!upstreamUrl) return res.status(404).json({ error: 'Preview expired. Re-analyse the URL.' })

  // Abort the upstream fetch if the browser goes away mid-stream.
  const controller = new AbortController()
  res.on('close', () => {
    if (!res.writableFinished) controller.abort()
  })

  const headers = { 'User-Agent': 'Mozilla/5.0' }
  if (req.headers.range) headers.Range = req.headers.range

  let upstream
  try {
    upstream = await fetch(upstreamUrl, { headers, signal: controller.signal })
  } catch (err) {
    if (controller.signal.aborted) return
    console.error('[preview] upstream fetch failed:', err.cause?.code || err.message)
    return res.status(502).json({ error: 'Could not fetch preview stream.' })
  }

  if (!upstream.ok && upstream.status !== 206) {
    return res.status(502).json({ error: `Upstream returned ${upstream.status}.` })
  }

  res.status(upstream.status)
  for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(name)
    if (value) res.setHeader(name, value)
  }
  res.setHeader('Cache-Control', 'no-store')

  Readable.fromWeb(upstream.body)
    .on('error', () => res.destroy())
    .pipe(res)
}))

app.post('/api/download', limiter.middleware(), requireYtDlp, asyncHandler(async (req, res) => {
  const url = parseMediaUrl(req.body?.url)
  const { format, title } = req.body || {}
  if (!url) return res.status(400).json({ error: 'Please enter a valid http(s) video URL.' })
  if (!isValidFormat(format)) return res.status(400).json({ error: 'Invalid format selection.' })

  const job = await downloads.create({ url, format, title: typeof title === 'string' ? title : undefined })
  res.status(202).json(downloads.toJSON(job))
}))

app.get('/api/download/:id', (req, res) => {
  const job = downloads.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Download not found or expired.' })
  res.json(downloads.toJSON(job))
})

app.delete('/api/download/:id', asyncHandler(async (req, res) => {
  const cancelled = await downloads.cancel(req.params.id)
  res.status(cancelled ? 200 : 404).json({ cancelled })
}))

app.get('/api/download/:id/file', (req, res) => {
  const job = downloads.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Download not found or expired.' })
  if (job.status !== 'ready') return res.status(409).json({ error: 'Download is not ready yet.' })

  res.download(job.filePath, job.fileName, { cacheControl: false }, (err) => {
    if (err && !res.headersSent) res.status(500).json({ error: 'Failed to send file.' })
    // Allow a brief window for browser retries, then free the disk space.
    if (!err) downloads.scheduleRemoval(job.id)
  })
})

// Serve the built frontend when present (Docker / production).
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: 'index.html', maxAge: '1h' }))
  app.get(/^\/(?!api\/).*/, (req, res) => res.sendFile(path.join(DIST_DIR, 'index.html')))
}

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof YtDlpError) {
    if (err.details) console.error(`[yt-dlp] ${err.details.trim().split('\n').slice(-3).join(' | ')}`)
    return res.status(err.status).json({ error: err.message })
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'Invalid request body.' })
  }
  if (err.status) return res.status(err.status).json({ error: err.message })
  console.error(err)
  res.status(500).json({ error: 'Internal server error.' })
})

const server = app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})

let shuttingDown = false
const shutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n${signal} received, shutting down...`)
  server.close()
  await downloads.shutdown()
  process.exit(0)
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
