/**
 * Vercel Serverless Function: POST /api/youtube-upload
 *
 * Receives a video blob (multipart form) and uploads it to YouTube.
 *
 * Required environment variables (Vercel dashboard → Settings → Env Vars):
 *   YOUTUBE_CLIENT_ID      – Google Cloud Console → OAuth 2.0 client ID
 *   YOUTUBE_CLIENT_SECRET  – Google Cloud Console → OAuth 2.0 client secret
 *   YOUTUBE_REFRESH_TOKEN  – one-time token from OAuth Playground (see below)
 *
 * How to get YOUTUBE_REFRESH_TOKEN (one time):
 *  1. Go to https://developers.google.com/oauthplayground
 *  2. Click settings gear → check "Use your own OAuth credentials"
 *  3. Enter your client_id + client_secret
 *  4. Authorize scope: https://www.googleapis.com/auth/youtube.upload
 *  5. Exchange auth code → copy the refresh_token
 */

import { IncomingForm } from 'formidable'
import fs from 'fs'

export const config = {
  api: {
    bodyParser: false, // formidable handles parsing
    sizeLimit: '100mb',
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let videoPath
  try {
    // Parse multipart form
    const { fields, files } = await parseForm(req)
    const videoFile = files.video?.[0] ?? files.video
    if (!videoFile) return res.status(400).json({ error: 'No video file received' })

    videoPath = videoFile.filepath
    const title = (fields.title?.[0] ?? fields.title ?? 'Notes Video').slice(0, 100)
    const description = fields.description?.[0] ?? fields.description ?? ''

    // Get YouTube access token
    const accessToken = await getAccessToken()

    // Upload to YouTube
    const { videoId, youtubeUrl } = await uploadToYouTube(accessToken, videoPath, title, description)

    return res.status(200).json({ youtubeUrl, videoId, title })
  } catch (err) {
    console.error('[/api/youtube-upload]', err)
    return res.status(500).json({ error: err.message || 'Upload failed' })
  } finally {
    if (videoPath) fs.unlink(videoPath, () => {})
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 100 * 1024 * 1024 })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

async function getAccessToken() {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  })
  if (!resp.ok) throw new Error('YouTube OAuth failed: ' + (await resp.text()))
  const data = await resp.json()
  if (!data.access_token) throw new Error('No access token returned')
  return data.access_token
}

async function uploadToYouTube(accessToken, videoPath, title, description) {
  const videoBuffer = fs.readFileSync(videoPath)
  const byteLength = videoBuffer.byteLength

  // Initiate resumable upload
  const initResp = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/webm',
        'X-Upload-Content-Length': String(byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
          tags: ['notes', 'auto-generated'],
          categoryId: '27', // Education
        },
        status: { privacyStatus: 'public' },
      }),
    }
  )

  if (!initResp.ok) {
    throw new Error('YouTube upload init failed: ' + (await initResp.text()))
  }

  const uploadUrl = initResp.headers.get('Location')
  if (!uploadUrl) throw new Error('No upload URL returned from YouTube')

  // Send video bytes
  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/webm',
      'Content-Length': String(byteLength),
    },
    body: videoBuffer,
  })

  if (!uploadResp.ok) {
    throw new Error('YouTube upload failed: ' + (await uploadResp.text()))
  }

  const data = await uploadResp.json()
  const videoId = data.id
  return { videoId, youtubeUrl: `https://www.youtube.com/watch?v=${videoId}` }
}
