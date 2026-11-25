const hasVideo = (f) => Boolean(f.vcodec && f.vcodec !== 'none')
const hasAudio = (f) => Boolean(f.acodec && f.acodec !== 'none')
const sizeOf = (f) => f.filesize ?? f.filesize_approx ?? null

function keepBest(formats, keyFn, scoreFn) {
  const best = new Map()
  for (const format of formats) {
    const key = keyFn(format)
    const existing = best.get(key)
    if (!existing || scoreFn(format) > scoreFn(existing)) best.set(key, format)
  }
  return [...best.values()]
}

// Prefer mp4 (most portable), then larger size as a proxy for bitrate.
const videoScore = (f) => (f.ext === 'mp4' ? 1e12 : 0) + (sizeOf(f) || 0)
const qualityLabel = (f) => `${f.height}p${f.fps && f.fps > 30 ? Math.round(f.fps) : ''}`

/**
 * Builds the list the UI shows. "video" entries are video-only streams that
 * yt-dlp will merge with the best audio; they are omitted when ffmpeg is not
 * available because the merge would fail.
 */
export function buildFormats(allFormats, { ffmpegAvailable = true } = {}) {
  const combined = keepBest(
    allFormats.filter((f) => hasVideo(f) && hasAudio(f) && f.height),
    (f) => f.height,
    videoScore
  )
    .sort((a, b) => b.height - a.height)
    .map((f) => ({
      format_id: f.format_id,
      ext: f.ext,
      quality: `${qualityLabel(f)} (Video + Audio)`,
      filesize: sizeOf(f),
      type: 'combined',
      height: f.height
    }))

  const videoOnly = !ffmpegAvailable
    ? []
    : keepBest(
      allFormats.filter((f) => hasVideo(f) && !hasAudio(f) && f.height),
      (f) => f.height,
      videoScore
    )
      .sort((a, b) => b.height - a.height)
      .map((f) => ({
        // Prefer m4a audio so the mp4 remux does not need re-encoding.
        format_id: `${f.format_id}+bestaudio[ext=m4a]/${f.format_id}+bestaudio`,
        ext: 'mp4',
        quality: `${qualityLabel(f)} (Auto-merge Audio)`,
        filesize: sizeOf(f),
        type: 'video',
        height: f.height
      }))

  const audioOnly = keepBest(
    allFormats.filter((f) => hasAudio(f) && !hasVideo(f)),
    (f) => Math.round(f.abr || 0) || f.format_id,
    (f) => (f.ext === 'm4a' ? 1e12 : 0) + (sizeOf(f) || 0)
  )
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))
    .map((f) => ({
      format_id: f.format_id,
      ext: f.ext,
      quality: `Audio Only (${f.abr ? `${Math.round(f.abr)} kbps` : 'unknown bitrate'})`,
      filesize: sizeOf(f),
      type: 'audio',
      abr: f.abr
    }))

  return [...combined, ...videoOnly, ...audioOnly]
}

const MIME_BY_EXT = {
  mp4: 'video/mp4',
  m4a: 'audio/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  opus: 'audio/ogg'
}

/**
 * Picks the stream the in-app player should use: a progressive (video+audio)
 * stream up to 720p, falling back to video-only, then audio-only.
 */
export function pickPreview(allFormats, info) {
  const byHeightDesc = (a, b) => (b.height || 0) - (a.height || 0)
  const browserFriendly = (f) => f.url && f.protocol !== 'm3u8_native' && f.protocol !== 'm3u8' && !/^(mhtml|storyboard)/.test(f.format_id || '')

  const combined = allFormats
    .filter((f) => browserFriendly(f) && hasVideo(f) && hasAudio(f) && (f.height || 0) <= 720)
    .sort(byHeightDesc)[0]
  const videoOnly = combined ? null : allFormats
    .filter((f) => browserFriendly(f) && hasVideo(f) && (f.height || 0) <= 720)
    .sort(byHeightDesc)[0]
  const audioOnly = combined || videoOnly ? null : allFormats
    .filter((f) => browserFriendly(f) && hasAudio(f))
    .sort((a, b) => (b.abr || 0) - (a.abr || 0))[0]

  const chosen = combined || videoOnly || audioOnly
  if (!chosen) {
    return info.url
      ? { url: info.url, kind: hasVideo(info) ? 'video' : 'audio', mime: MIME_BY_EXT[info.ext] || 'video/mp4' }
      : null
  }

  return {
    url: chosen.url,
    kind: hasVideo(chosen) ? 'video' : 'audio',
    mime: MIME_BY_EXT[chosen.ext] || (hasVideo(chosen) ? 'video/mp4' : 'audio/mp4')
  }
}

export function formatDuration(seconds) {
  if (!seconds || Number.isNaN(Number(seconds))) return 'Unknown'
  const total = Math.floor(Number(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(secs).padStart(2, '0')
  return hours > 0 ? `${hours}:${mm}:${ss}` : `${minutes}:${ss}`
}

export function formatUploadDate(yyyymmdd) {
  if (!/^\d{8}$/.test(String(yyyymmdd || ''))) return null
  const s = String(yyyymmdd)
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}
