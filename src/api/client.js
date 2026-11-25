import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 90_000
})

export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (axios.isCancel(err)) return null
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.request && !err?.response) return 'Cannot reach the server. Is the backend running?'
  return err?.message || fallback
}

export async function fetchHealth() {
  const { data } = await api.get('/health', { timeout: 5_000 })
  return data
}

export async function fetchMediaInfo(url, signal) {
  const { data } = await api.post('/video-info', { url }, { signal })
  return data
}

export async function startDownload({ url, format, title }) {
  const { data } = await api.post('/download', { url, format, title })
  return data
}

export async function getDownloadStatus(id) {
  const { data } = await api.get(`/download/${id}`, { timeout: 10_000 })
  return data
}

export async function cancelDownload(id) {
  await api.delete(`/download/${id}`).catch(() => {})
}

export function downloadFileUrl(id) {
  return `/api/download/${id}/file`
}
