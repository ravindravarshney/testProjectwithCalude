import { generateVideoBlob } from './canvasVideoService'

/**
 * Orchestrates the full flow:
 *  1. Generate video in-browser (Canvas → WebM blob)
 *  2. Upload to YouTube via /api/youtube-upload
 *  3. Return YouTube URL
 */
export async function convertNotesToVideo(notes, options, onProgress) {
  const { style = 'educational' } = options

  // Step 1: render video in browser
  const blob = await generateVideoBlob(notes, style, (pct, step) => {
    onProgress(pct, step)
  })

  // Step 2: upload to YouTube
  onProgress(96, 'Uploading to YouTube...')

  const form = new FormData()
  form.append('video', blob, 'notes-video.webm')
  form.append('title', notes.slice(0, 100).trim())
  form.append('description', notes)

  const resp = await fetch('/api/youtube-upload', {
    method: 'POST',
    body: form,
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body.error || `Upload failed (${resp.status})`)
  }

  onProgress(100, 'Done!')
  return resp.json()
}
