/**
 * musicService.js
 * Generates background music using the Web Audio API — 100% free, no libraries.
 *
 * playIntroMusic  – uplifting arpeggio for the title slide
 * playOutroMusic  – descending arpeggio for the end slide
 * playAmbient     – very soft sustained chord pad during content slides
 */

const C_MAJOR = [261.63, 329.63, 392.0, 523.25] // C4 E4 G4 C5
const C_MAJOR_DESC = [523.25, 392.0, 329.63, 261.63]
const PAD_FREQS = [130.81, 196.0, 261.63] // C3 G3 C4

export function playIntroMusic(audioCtx, destination) {
  return playArpeggio(audioCtx, destination, C_MAJOR, 0.18, 'intro')
}

export function playOutroMusic(audioCtx, destination) {
  return playArpeggio(audioCtx, destination, C_MAJOR_DESC, 0.18, 'outro')
}

/**
 * Plays a very soft sustained pad chord for `durationSecs`.
 * Returns a stop function.
 */
export function playAmbient(audioCtx, destination, durationSecs) {
  const masterGain = audioCtx.createGain()
  masterGain.gain.setValueAtTime(0, audioCtx.currentTime)
  masterGain.gain.linearRampToValueAtTime(0.025, audioCtx.currentTime + 0.5)
  masterGain.gain.setValueAtTime(0.025, audioCtx.currentTime + durationSecs - 0.5)
  masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + durationSecs)
  masterGain.connect(destination)

  const oscs = PAD_FREQS.map((freq) => {
    const osc = audioCtx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    osc.connect(masterGain)
    osc.start()
    osc.stop(audioCtx.currentTime + durationSecs)
    return osc
  })

  return () => oscs.forEach((o) => { try { o.stop() } catch (_) {} })
}

// ── Internal ──────────────────────────────────────────────────────────────────

function playArpeggio(audioCtx, destination, notes, volume, type) {
  const masterGain = audioCtx.createGain()
  masterGain.gain.value = volume
  masterGain.connect(destination)

  const noteSpacing = 0.28
  const noteDuration = 0.55

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator()
    const noteGain = audioCtx.createGain()

    osc.type = type === 'outro' ? 'triangle' : 'sine'
    osc.frequency.value = freq
    osc.connect(noteGain)
    noteGain.connect(masterGain)

    const t = audioCtx.currentTime + i * noteSpacing
    noteGain.gain.setValueAtTime(0, t)
    noteGain.gain.linearRampToValueAtTime(1, t + 0.04)
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration)

    osc.start(t)
    osc.stop(t + noteDuration)
  })

  // Total duration = last note start + note duration
  return (notes.length - 1) * noteSpacing + noteDuration
}
