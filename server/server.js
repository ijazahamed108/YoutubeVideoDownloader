import express from 'express'
import cors from 'cors'
import { spawn } from 'child_process'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Find yt-dlp path
let ytDlpPath = 'yt-dlp'

// Work around YouTube web/tv client SABR and nsig extraction failures
const YT_DLP_COMMON_ARGS = [
  '--extractor-args', 'youtube:player_client=android,web'
]

const findYtDlp = async () => {
  const possiblePaths = [
    '/opt/homebrew/bin/yt-dlp',
    '/usr/local/bin/yt-dlp',
    'yt-dlp',
    `${process.env.HOME}/.local/bin/yt-dlp`,
    `${process.env.HOME}/Library/Python/3.12/bin/yt-dlp`,
    `${process.env.HOME}/Library/Python/3.11/bin/yt-dlp`,
    `${process.env.HOME}/Library/Python/3.10/bin/yt-dlp`,
    `${process.env.HOME}/Library/Python/3.9/bin/yt-dlp`
  ]
  
  for (const path of possiblePaths) {
    try {
      await execAsync(`${path} --version`)
      ytDlpPath = path
      console.log(`yt-dlp found at: ${path}`)
      return
    } catch (error) {
      continue
    }
  }
  
  console.log('yt-dlp not found. Installing...')
  try {
    await execAsync('pip3 install yt-dlp')
    await findYtDlp() // Try again after installation
  } catch (installError) {
    console.error('Failed to install yt-dlp:', installError.message)
  }
}

// Get video information and available formats
function dedupeByHeight(formats) {
  const byHeight = new Map()
  for (const format of formats) {
    const existing = byHeight.get(format.height)
    if (!existing || (format.filesize || 0) > (existing.filesize || 0)) {
      byHeight.set(format.height, format)
    }
  }
  return [...byHeight.values()].sort((a, b) => b.height - a.height)
}

function dedupeByAbr(formats) {
  const byAbr = new Map()
  for (const format of formats) {
    const key = format.abr || format.format_id
    if (!byAbr.has(key)) {
      byAbr.set(key, format)
    }
  }
  return [...byAbr.values()].sort((a, b) => (b.abr || 0) - (a.abr || 0))
}

function buildFormats(allFormats) {
  const combinedFormats = dedupeByHeight(
    allFormats
      .filter(f => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.height)
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: `${f.height}p (Video + Audio)`,
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec,
        type: 'combined',
        height: f.height
      }))
  )

  const videoFormats = dedupeByHeight(
    allFormats
      .filter(f => f.vcodec && f.vcodec !== 'none' && f.height && (!f.acodec || f.acodec === 'none'))
      .map(f => ({
        format_id: `${f.format_id}+bestaudio`,
        ext: 'mp4',
        quality: `${f.height}p (Auto-merge Audio)`,
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: 'merged',
        type: 'video',
        height: f.height
      }))
  )

  const audioFormats = dedupeByAbr(
    allFormats
      .filter(f => f.acodec && f.acodec !== 'none' && (!f.vcodec || f.vcodec === 'none'))
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: `Audio Only (${f.abr || 'Unknown'}kbps)`,
        filesize: f.filesize,
        vcodec: f.vcodec,
        acodec: f.acodec,
        type: 'audio',
        abr: f.abr
      }))
  )

  return [...combinedFormats, ...videoFormats, ...audioFormats]
}

function getPreviewStream(allFormats, info) {
  const combined = allFormats
    .filter(f => f.vcodec && f.vcodec !== 'none' && f.acodec && f.acodec !== 'none' && f.url && f.height <= 720)
    .sort((a, b) => b.height - a.height)

  if (combined.length) {
    return {
      streamUrl: combined[0].url,
      vcodec: combined[0].vcodec,
      acodec: combined[0].acodec
    }
  }

  const video = allFormats
    .filter(f => f.vcodec && f.vcodec !== 'none' && f.url && f.height <= 720)
    .sort((a, b) => b.height - a.height)

  if (video.length) {
    return {
      streamUrl: video[0].url,
      vcodec: video[0].vcodec,
      acodec: 'none'
    }
  }

  const audio = allFormats.filter(f => f.acodec && f.acodec !== 'none' && f.url)
  if (audio.length) {
    return {
      streamUrl: audio[0].url,
      vcodec: 'none',
      acodec: audio[0].acodec
    }
  }

  return {
    streamUrl: info.url || null,
    vcodec: info.vcodec,
    acodec: info.acodec
  }
}

app.post('/api/video-info', async (req, res) => {
  const { url } = req.body
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    const { stdout } = await execAsync(
      `${ytDlpPath} -J --extractor-args "youtube:player_client=android,web" "${url}"`
    )
    const info = JSON.parse(stdout)
    
    const allFormats = info.formats || []
    const formats = buildFormats(allFormats)
    const preview = getPreviewStream(allFormats, info)

    res.json({
      info: {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: formatDuration(info.duration),
        uploader: info.uploader,
        view_count: info.view_count,
        upload_date: info.upload_date,
        vcodec: preview.vcodec,
        acodec: preview.acodec
      },
      formats,
      streamUrl: preview.streamUrl
    })
  } catch (error) {
    console.error('Error fetching video info:', error)
    res.status(500).json({ error: 'Failed to fetch video information' })
  }
})

// Download video with progress
app.post('/api/download', async (req, res) => {
  const { url, format } = req.body
  
  if (!url || !format) {
    return res.status(400).json({ error: 'URL and format are required' })
  }

  try {
    const ytDlp = spawn(ytDlpPath, [
      '-f', format,
      '--no-playlist',
      '--newline',
      ...YT_DLP_COMMON_ARGS,
      '-o', '-',
      url
    ])

    res.setHeader('Content-Type', 'application/octet-stream')
    res.setHeader('Content-Disposition', 'attachment')

    ytDlp.stdout.pipe(res)
    
    ytDlp.stderr.on('data', (data) => {
      const output = data.toString()
      console.log('yt-dlp progress:', output)
    })

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`)
      }
    })

    ytDlp.on('error', (error) => {
      console.error('yt-dlp error:', error)
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' })
      }
    })
  } catch (error) {
    console.error('Download error:', error)
    res.status(500).json({ error: 'Download failed' })
  }
})

// Get download progress
app.post('/api/download-progress', async (req, res) => {
  const { url, format } = req.body
  
  if (!url || !format) {
    return res.status(400).json({ error: 'URL and format are required' })
  }

  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Transfer-Encoding': 'chunked'
  })

  try {
    const ytDlp = spawn(ytDlpPath, [
      '-f', format,
      '--no-playlist',
      '--newline',
      '--progress',
      '--no-warnings',
      ...YT_DLP_COMMON_ARGS,
      '-o', '-',
      url
    ])

    ytDlp.stderr.on('data', (data) => {
      const output = data.toString()
      const progressMatch = output.match(/\[download\]\s+(\d+\.\d+)%/)
      if (progressMatch) {
        res.write(`data: ${progressMatch[1]}\n\n`)
      }
    })

    ytDlp.on('close', (code) => {
      res.write('data: 100\n\n')
      res.end()
    })

    ytDlp.on('error', (error) => {
      res.write(`error: ${error.message}\n\n`)
      res.end()
    })
  } catch (error) {
    res.write(`error: ${error.message}\n\n`)
    res.end()
  }
})

// Get stream URL for preview
app.post('/api/stream-info', async (req, res) => {
  const { url } = req.body
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    const { stdout } = await execAsync(
      `${ytDlpPath} -J -f "best[height<=720]" --extractor-args "youtube:player_client=android,web" "${url}"`
    )
    const info = JSON.parse(stdout)
    
    // Get the best quality stream URL for preview
    const streamUrl = info.url || info.formats?.[0]?.url
    
    res.json({
      info: {
        title: info.title,
        thumbnail: info.thumbnail,
        duration: formatDuration(info.duration),
        uploader: info.uploader,
        view_count: info.view_count,
        upload_date: info.upload_date,
        vcodec: info.vcodec,
        acodec: info.acodec
      },
      streamUrl
    })
  } catch (error) {
    console.error('Error fetching stream info:', error)
    res.status(500).json({ error: 'Failed to fetch stream information' })
  }
})

// Utility function to format duration
function formatDuration(seconds) {
  if (!seconds) return 'Unknown'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await findYtDlp()
})