/**
 * Fetches TTS audio for a text string via /api/tts (proxied StreamElements).
 * Returns an ArrayBuffer of MP3 data.
 */
export async function fetchTTSAudio(text, voice = 'Brian') {
  const resp = await fetch(`/api/tts?voice=${voice}&text=${encodeURIComponent(text)}`)
  if (!resp.ok) throw new Error('TTS fetch failed')
  return resp.arrayBuffer()
}
