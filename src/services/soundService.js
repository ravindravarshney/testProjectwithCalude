/**
 * soundService.js — Web Audio API sound effects
 * Created lazily on first user gesture (answer tap) — no unlock overlay needed.
 */

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Ascending chime — correct answer */
export function playDing() {
  try {
    const ac   = getCtx()
    const now  = ac.currentTime
    const freqs = [523, 659, 784, 1047]
    freqs.forEach((f, i) => {
      const osc  = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = f
      const t = now + i * 0.1
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.start(t); osc.stop(t + 0.35)
    })
  } catch (_) {}
}

/** Descending buzzer — wrong answer */
export function playWhoops() {
  try {
    const ac  = getCtx()
    const now = ac.currentTime
    const osc  = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(440, now)
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.5)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55)
    osc.start(now); osc.stop(now + 0.55)
  } catch (_) {}
}

/** Sparkle — new fact reveal */
export function playSparkle() {
  try {
    const ac   = getCtx()
    const now  = ac.currentTime
    const freqs = [880, 1047, 1319]
    freqs.forEach((f, i) => {
      const osc  = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain); gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = f
      const t = now + i * 0.08
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.18, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
      osc.start(t); osc.stop(t + 0.2)
    })
  } catch (_) {}
}
