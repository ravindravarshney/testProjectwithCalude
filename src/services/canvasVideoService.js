import { fetchTTSAudio } from './ttsService'
import { playIntroMusic, playOutroMusic, playAmbient } from './musicService'

const W = 1280
const H = 720
const FPS = 30
const FADE_MS = 500
const MIN_SLIDE_MS = 3000 // minimum slide duration if TTS is shorter

export async function generateVideoBlob(notes, style, onProgress) {
  const slides = buildSlides(notes)

  // ── Step 1: Pre-generate TTS for all slides ──────────────────────────────
  onProgress(2, 'Generating voice narration...')
  const ttsBuffers = []
  for (let i = 0; i < slides.length; i++) {
    try {
      const buf = await fetchTTSAudio(slides[i])
      ttsBuffers.push(buf)
    } catch {
      ttsBuffers.push(null) // silent fallback for this slide
    }
    onProgress(2 + Math.round(((i + 1) / slides.length) * 25), `Voice ${i + 1}/${slides.length}...`)
  }

  // ── Step 2: Set up AudioContext + canvas ─────────────────────────────────
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  const audioDest = audioCtx.createMediaStreamDestination()

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Combine canvas video track + audio track
  let mediaStream
  try {
    mediaStream = new MediaStream([
      ...canvas.captureStream(FPS).getTracks(),
      ...audioDest.stream.getTracks(),
    ])
  } catch {
    mediaStream = canvas.captureStream(FPS) // fallback: video only
  }

  const mimeType = getSupportedMimeType()
  const recorder = new MediaRecorder(mediaStream, { mimeType, videoBitsPerSecond: 2_500_000 })
  const chunks = []
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
  recorder.start(200)

  // ── Step 3: Title slide + intro music ────────────────────────────────────
  playIntroMusic(audioCtx, audioDest)
  await renderSlide(ctx, { type: 'title', text: 'Notes Video', sub: new Date().toLocaleDateString() }, 4000)
  onProgress(30, 'Title slide done...')

  // ── Step 4: Content slides with TTS + ambient music ──────────────────────
  for (let i = 0; i < slides.length; i++) {
    let slideDurationMs = MIN_SLIDE_MS

    if (ttsBuffers[i]) {
      try {
        const decoded = await audioCtx.decodeAudioData(ttsBuffers[i].slice(0))
        slideDurationMs = Math.max(MIN_SLIDE_MS, decoded.duration * 1000 + 800)

        const src = audioCtx.createBufferSource()
        src.buffer = decoded
        const gain = audioCtx.createGain()
        gain.gain.value = 1.0
        src.connect(gain)
        gain.connect(audioDest)
        src.start()
      } catch {
        // TTS decode failed — slide plays silently
      }
    }

    playAmbient(audioCtx, audioDest, slideDurationMs / 1000)

    await renderSlide(
      ctx,
      { type: 'content', text: slides[i], index: i + 1, total: slides.length },
      slideDurationMs,
      style
    )

    const pct = 30 + Math.round(((i + 1) / slides.length) * 55)
    onProgress(pct, `Slide ${i + 1} of ${slides.length}...`)
  }

  // ── Step 5: End slide + outro music ──────────────────────────────────────
  playOutroMusic(audioCtx, audioDest)
  await renderSlide(ctx, { type: 'end', text: 'Ravindra Projects' }, 4000)
  onProgress(90, 'Finalizing video...')

  recorder.stop()
  await new Promise((res) => (recorder.onstop = res))
  await audioCtx.close()

  onProgress(95, 'Preparing upload...')
  return new Blob(chunks, { type: mimeType })
}

// ── Slide renderer ────────────────────────────────────────────────────────────

function renderSlide(ctx, slide, durationMs, style = 'educational') {
  const holdMs = Math.max(500, durationMs - FADE_MS * 2)
  const totalMs = FADE_MS + holdMs + FADE_MS
  const start = performance.now()

  return new Promise((res) => {
    function frame() {
      const elapsed = performance.now() - start
      const alpha =
        elapsed < FADE_MS
          ? elapsed / FADE_MS
          : elapsed > FADE_MS + holdMs
          ? Math.max(0, 1 - (elapsed - FADE_MS - holdMs) / FADE_MS)
          : 1

      drawBackground(ctx, slide.type)
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

      if (slide.type === 'title') drawTitleSlide(ctx, slide.text, slide.sub)
      else if (slide.type === 'content') drawContentSlide(ctx, slide.text, slide.index, slide.total, style)
      else if (slide.type === 'end') drawEndSlide(ctx, slide.text)

      ctx.globalAlpha = 1

      if (elapsed < totalMs) requestAnimationFrame(frame)
      else res()
    }
    requestAnimationFrame(frame)
  })
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

function drawBackground(ctx, type) {
  ctx.fillStyle = '#0f0f1a'
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7)
  glow.addColorStop(0, type === 'title' ? 'rgba(168,85,247,0.1)' : 'rgba(233,69,96,0.07)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  const bar = ctx.createLinearGradient(0, 0, W, 0)
  bar.addColorStop(0, '#e94560')
  bar.addColorStop(1, '#a855f7')
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, W, 5)
}

function drawTitleSlide(ctx, text, sub) {
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 72px "Segoe UI", sans-serif`
  ctx.fillText(text, W / 2, H / 2 - 30)
  ctx.fillStyle = '#6b7280'
  ctx.font = `28px "Segoe UI", sans-serif`
  ctx.fillText(sub, W / 2, H / 2 + 30)

  ctx.fillStyle = '#3d4151'
  ctx.font = `20px "Segoe UI", sans-serif`
  ctx.fillText('Ravindra Projects', W / 2, H / 2 + 80)
}

function drawContentSlide(ctx, text, index, total, style) {
  // Slide badge
  ctx.fillStyle = 'rgba(233,69,96,0.15)'
  roundRect(ctx, 60, 44, 92, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#e94560'
  ctx.font = `600 18px "Segoe UI", sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`${index} / ${total}`, 80, 68)

  // Style label
  ctx.fillStyle = '#3d4151'
  ctx.font = `16px "Segoe UI", sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(style.toUpperCase(), W - 60, 68)

  // Main text
  ctx.fillStyle = '#ffffff'
  ctx.font = `500 40px "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  const lines = wrapText(ctx, text, W - 200)
  const lineH = 58
  let y = (H - lines.length * lineH) / 2 + lineH / 2
  for (const line of lines) {
    ctx.fillText(line, W / 2, y)
    y += lineH
  }
}

function drawEndSlide(ctx, text) {
  ctx.textAlign = 'center'
  const grad = ctx.createLinearGradient(W / 4, 0, (W * 3) / 4, 0)
  grad.addColorStop(0, '#e94560')
  grad.addColorStop(1, '#a855f7')
  ctx.fillStyle = grad
  ctx.font = `bold 60px "Segoe UI", sans-serif`
  ctx.fillText(text, W / 2, H / 2 - 20)
  ctx.fillStyle = '#4b5563'
  ctx.font = `26px "Segoe UI", sans-serif`
  ctx.fillText('Thanks for watching', W / 2, H / 2 + 44)
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

function buildSlides(notes) {
  const paras = notes.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  if (paras.length > 1) return paras

  const sentences = notes.match(/[^.!?\n]+[.!?\n]*/g) ?? [notes]
  const slides = []
  let current = ''
  for (const s of sentences) {
    if (current.length + s.length > 220 && current) {
      slides.push(current.trim())
      current = s
    } else {
      current += (current ? ' ' : '') + s
    }
  }
  if (current.trim()) slides.push(current.trim())
  return slides.length ? slides : [notes]
}

function getSupportedMimeType() {
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return types.find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm'
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
