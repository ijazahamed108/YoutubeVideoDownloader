import { spawn } from 'child_process'
import { mkdtemp, readdir, rm, stat } from 'fs/promises'
import { randomUUID } from 'crypto'
import os from 'os'
import path from 'path'
import { friendlyError } from './ytdlp.js'
import { toSafeFilename } from './validate.js'

const PROGRESS_RE = /\[download\]\s+(\d+(?:\.\d+)?)%/
const DESTINATION_RE = /\[download\]\s+Destination:/
const MERGE_RE = /\[Merger\]|\[ExtractAudio\]|\[VideoRemuxer\]/

/**
 * Manages yt-dlp download jobs. Each job downloads into its own temp
 * directory; the finished file is served once and then removed. Jobs that are
 * never collected are swept after `ttlMs`.
 */
export class DownloadManager {
  constructor({ ytDlpPath, baseArgs, maxConcurrent = 3, ttlMs = 30 * 60_000, tmpRoot = os.tmpdir() }) {
    this.ytDlpPath = ytDlpPath
    this.baseArgs = baseArgs
    this.maxConcurrent = maxConcurrent
    this.ttlMs = ttlMs
    this.tmpRoot = tmpRoot
    this.jobs = new Map()
    this.sweeper = setInterval(() => this.sweep(), 60_000).unref()
  }

  get activeCount() {
    return [...this.jobs.values()].filter((j) => j.status === 'downloading' || j.status === 'processing').length
  }

  async create({ url, format, title }) {
    if (this.activeCount >= this.maxConcurrent) {
      const err = new Error('Too many downloads in progress. Please wait for one to finish.')
      err.status = 429
      throw err
    }

    const id = randomUUID()
    const dir = await mkdtemp(path.join(this.tmpRoot, 'ytdl-'))
    const job = {
      id,
      dir,
      url,
      format,
      title: title || 'video',
      status: 'downloading',
      progress: 0,
      error: null,
      filePath: null,
      fileName: null,
      size: null,
      createdAt: Date.now(),
      child: null
    }
    this.jobs.set(id, job)
    this.#spawn(job)
    return job
  }

  get(id) {
    return this.jobs.get(id) || null
  }

  /** Snapshot that is safe to send to the client. */
  toJSON(job) {
    return {
      id: job.id,
      status: job.status,
      progress: job.progress,
      error: job.error,
      fileName: job.fileName,
      size: job.size
    }
  }

  async cancel(id) {
    const job = this.jobs.get(id)
    if (!job) return false
    if (job.child && job.child.exitCode === null) {
      job.cancelled = true
      job.child.kill('SIGTERM')
      setTimeout(() => job.child?.exitCode === null && job.child.kill('SIGKILL'), 3000).unref()
    }
    job.status = 'cancelled'
    await this.remove(id)
    return true
  }

  async remove(id) {
    const job = this.jobs.get(id)
    if (!job) return
    this.jobs.delete(id)
    await rm(job.dir, { recursive: true, force: true }).catch(() => {})
  }

  /** Removes the job shortly after its file has been served. */
  scheduleRemoval(id, delayMs = 60_000) {
    setTimeout(() => this.remove(id), delayMs).unref()
  }

  async sweep() {
    const now = Date.now()
    for (const job of this.jobs.values()) {
      if (now - job.createdAt > this.ttlMs) {
        if (job.child && job.child.exitCode === null) job.child.kill('SIGKILL')
        await this.remove(job.id)
      }
    }
  }

  async shutdown() {
    clearInterval(this.sweeper)
    for (const job of this.jobs.values()) {
      if (job.child && job.child.exitCode === null) job.child.kill('SIGKILL')
    }
    await Promise.all([...this.jobs.keys()].map((id) => this.remove(id)))
  }

  #spawn(job) {
    const isMerge = job.format.includes('+')
    const args = [
      '-f', job.format,
      ...this.baseArgs,
      '--newline',
      '--progress',
      ...(isMerge ? ['--merge-output-format', 'mp4'] : []),
      '-o', path.join(job.dir, 'media.%(ext)s'),
      job.url
    ]

    const child = spawn(this.ytDlpPath, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    job.child = child

    // Merged formats download video and audio in two passes.
    const totalPhases = isMerge ? 2 : 1
    let phase = -1
    const stderr = []

    const onLine = (line) => {
      if (DESTINATION_RE.test(line)) phase = Math.min(phase + 1, totalPhases - 1)
      const match = line.match(PROGRESS_RE)
      if (match) {
        const pct = parseFloat(match[1])
        const overall = ((Math.max(phase, 0) + pct / 100) / totalPhases) * 100
        job.progress = Math.max(job.progress, Math.min(99, Math.round(overall)))
      }
      if (MERGE_RE.test(line)) {
        job.status = 'processing'
        job.progress = 99
      }
    }

    let buffered = ''
    child.stdout.on('data', (chunk) => {
      buffered += chunk.toString()
      const lines = buffered.split(/\r?\n/)
      buffered = lines.pop()
      lines.forEach(onLine)
    })
    child.stderr.on('data', (chunk) => {
      stderr.push(chunk)
      chunk.toString().split(/\r?\n/).forEach(onLine)
    })

    child.on('error', (err) => {
      job.status = 'error'
      job.error = `Could not start yt-dlp: ${err.message}`
    })

    child.on('close', async (code) => {
      if (job.cancelled || !this.jobs.has(job.id)) return
      if (code !== 0) {
        job.status = 'error'
        job.error = friendlyError(Buffer.concat(stderr).toString())
        return
      }
      try {
        const files = (await readdir(job.dir)).filter((f) => !/\.(part|ytdl|temp)$/.test(f))
        if (!files.length) throw new Error('yt-dlp finished without producing a file')
        const filePath = path.join(job.dir, files[0])
        const { size } = await stat(filePath)
        job.filePath = filePath
        job.size = size
        job.fileName = `${toSafeFilename(job.title)}${path.extname(filePath)}`
        job.progress = 100
        job.status = 'ready'
      } catch (err) {
        job.status = 'error'
        job.error = err.message
      }
    })
  }
}
