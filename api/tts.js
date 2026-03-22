/**
 * Vercel Serverless Function: GET /api/tts
 * Proxies StreamElements TTS to avoid CORS issues.
 * Free, no API key required.
 *
 * Query params:
 *   text  - text to speak
 *   voice - StreamElements voice (default: Brian)
 */
export default async function handler(req, res) {
  const { text, voice = 'Brian' } = req.query
  if (!text) return res.status(400).json({ error: 'text is required' })

  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`

  const resp = await fetch(url)
  if (!resp.ok) return res.status(502).json({ error: 'TTS service unavailable' })

  const buffer = await resp.arrayBuffer()
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Cache-Control', 'public, max-age=3600')
  res.send(Buffer.from(buffer))
}
