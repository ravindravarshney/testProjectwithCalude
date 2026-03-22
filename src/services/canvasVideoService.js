/**
 * canvasVideoService.js
 *
 * Converts notes to a video entirely in the browser:
 *  1. Splits notes into slides
 *  2. Animates each slide on a hidden <canvas>
 *  3. Records the canvas via MediaRecorder → WebM blob
 *
 * No external APIs needed — 100% free.
 */

const W = 1280
const H = 720
const FPS = 30
const SECONDS_PER_SLIDE = 6
const FADE_MS = 600

export async function generateVideoBlob(notes, style, onProgress) {
  const slides = buildSlides(notes)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  const stream = canvas.captureStream(FPS)
  const mimeType = getSupportedMimeType()
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 })
  const chunks = []

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  recorder.start(200)

  // Title slide
  await renderSlide(ctx, { type: 'title', text: 'Notes Video', sub: new Date().toLocaleDateString() })
  onProgress(5, 'Rendering title slide...')

  // Content slides
  for (let i = 0; i < slides.length; i++) {
    await renderSlide(ctx, { type: 'content', text: slides[i], index: i + 1, total: slides.length }, style)
    const pct = 5 + Math.round(((i + 1) / slides.length) * 80)
    onProgress(pct, `Rendering slide ${i + 1} of ${slides.length}...`)
  }

  // End slide
  await renderSlide(ctx, { type: 'end', text: 'Ravindra Projects' })
  onProgress(90, 'Finalizing video...')

  recorder.stop()
  await new Promise((res) => (recorder.onstop = res))

  onProgress(95, 'Preparing upload...')
  return new Blob(chunks, { type: mimeType })
}

// ── Slide renderer ────────────────────────────────────────────────────────────

function renderSlide(ctx, slide, style = 'educational') {
  const totalMs = FADE_MS + SECONDS_PER_SLIDE * 1000 + FADE_MS
  const startTime = performance.now()

  return new Promise((res) => {
    function frame() {
      const elapsed = performance.now() - startTime
      const alpha =
        elapsed < FADE_MS
          ? elapsed / FADE_MS
          : elapsed > FADE_MS + SECONDS_PER_SLIDE * 1000
          ? 1 - (elapsed - FADE_MS - SECONDS_PER_SLIDE * 1000) / FADE_MS
          : 1

      drawBackground(ctx, slide.type)

      ctx.globalAlpha = Math.max(0, Math.min(1, alpha))

      if (slide.type === 'title') {
        drawTitle(ctx, slide.text, slide.sub)
      } else if (slide.type === 'content') {
        drawContent(ctx, slide.text, slide.index, slide.total, style)
      } else if (slide.type === 'end') {
        drawEnd(ctx, slide.text)
      }

      ctx.globalAlpha = 1

      if (elapsed < totalMs) {
        requestAnimationFrame(frame)
      } else {
        res()
      }
    }
    requestAnimationFrame(frame)
  })
}

// ── Draw helpers ──────────────────────────────────────────────────────────────

function drawBackground(ctx, type) {
  // Base
  ctx.fillStyle = '#0f0f1a'
  ctx.fillRect(0, 0, W, H)

  // Subtle radial glow
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7)
  glow.addColorStop(0, type === 'title' ? 'rgba(168,85,247,0.08)' : 'rgba(233,69,96,0.06)')
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Top accent bar
  const bar = ctx.createLinearGradient(0, 0, W, 0)
  bar.addColorStop(0, '#e94560')
  bar.addColorStop(1, '#a855f7')
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, W, 5)
}

function drawTitle(ctx, text, sub) {
  ctx.textAlign = 'center'
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 72px "Segoe UI", sans-serif`
  ctx.fillText(text, W / 2, H / 2 - 30)

  ctx.fillStyle = '#6b7280'
  ctx.font = `28px "Segoe UI", sans-serif`
  ctx.fillText(sub, W / 2, H / 2 + 30)
}

function drawContent(ctx, text, index, total, style) {
  // Slide number badge
  ctx.fillStyle = 'rgba(233,69,96,0.15)'
  ctx.beginPath()
  ctx.roundRect(60, 50, 90, 36, 8)
  ctx.fill()
  ctx.fillStyle = '#e94560'
  ctx.font = `600 18px "Segoe UI", sans-serif`
  ctx.textAlign = 'left'
  ctx.fillText(`${index} / ${total}`, 80, 74)

  // Style label
  ctx.fillStyle = '#3d4151'
  ctx.font = `16px "Segoe UI", sans-serif`
  ctx.textAlign = 'right'
  ctx.fillText(style.toUpperCase(), W - 60, 74)

  // Main text — word-wrap
  ctx.fillStyle = '#ffffff'
  ctx.font = `500 40px "Segoe UI", sans-serif`
  ctx.textAlign = 'center'

  const lines = wrapText(ctx, text, W - 200)
  const lineH = 56
  const totalH = lines.length * lineH
  let y = (H - totalH) / 2 + lineH / 2

  for (const line of lines) {
    ctx.fillText(line, W / 2, y)
    y += lineH
  }
}

function drawEnd(ctx, text) {
  ctx.textAlign = 'center'

  const grad = ctx.createLinearGradient(W / 4, 0, (W * 3) / 4, 0)
  grad.addColorStop(0, '#e94560')
  grad.addColorStop(1, '#a855f7')
  ctx.fillStyle = grad
  ctx.font = `bold 56px "Segoe UI", sans-serif`
  ctx.fillText(text, W / 2, H / 2 - 20)

  ctx.fillStyle = '#4b5563'
  ctx.font = `24px "Segoe UI", sans-serif`
  ctx.fillText('Thanks for watching', W / 2, H / 2 + 40)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

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
  // Try to split on double newlines first
  const paras = notes.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
  if (paras.length > 1) return paras

  // Otherwise split into ~200-char chunks by sentence
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
