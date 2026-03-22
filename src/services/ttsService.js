/**
 * ttsService.js — Browser Web Speech API
 *
 * Uses the built-in SpeechSynthesis API (zero cost, zero network calls).
 * Different pitch + rate gives each character a distinct voice.
 */

const VOICES = {
  owl:   { pitch: 0.75, rate: 0.88 },   // Prof. Hoot — deep, measured
  bunny: { pitch: 1.40, rate: 1.05 },   // Buddy      — light, excited
}

// Browsers load the voice list asynchronously — wait for it once.
let voiceList = []
function loadVoices() {
  voiceList = speechSynthesis.getVoices()
}
loadVoices()
if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.onvoiceschanged = loadVoices
}

function pickVoice(preferFemale) {
  const lang = navigator.language?.startsWith('en') ? navigator.language : 'en'
  // Try to find an English voice matching gender preference
  const candidates = voiceList.filter((v) => v.lang.startsWith('en'))
  if (!candidates.length) return null

  // Heuristic: voices with 'female'/'zira'/'samantha' in name for bunny
  if (preferFemale) {
    const f = candidates.find((v) =>
      /female|samantha|zira|karen|moira|fiona|victoria|susan|alice|serena/i.test(v.name)
    )
    if (f) return f
  } else {
    const m = candidates.find((v) =>
      /male|daniel|david|alex|fred|tom|george|arthur/i.test(v.name)
    )
    if (m) return m
  }
  return candidates[0]
}

/**
 * Speak text with a character voice.
 * @param {string} text
 * @param {'owl'|'bunny'} character
 * @param {React.MutableRefObject} cancelRef  — resolves early if cancelRef.current becomes true
 * @returns {Promise<void>}
 */
export function speakLine(text, character, cancelRef) {
  return new Promise((resolve) => {
    if (typeof speechSynthesis === 'undefined') return resolve()

    // Cancel any in-progress speech
    speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const cfg = VOICES[character] ?? VOICES.owl

    utterance.pitch  = cfg.pitch
    utterance.rate   = cfg.rate
    utterance.volume = 1.0
    utterance.lang   = 'en-US'

    const voice = pickVoice(character === 'bunny')
    if (voice) utterance.voice = voice

    utterance.onend   = resolve
    utterance.onerror = resolve

    // Poll for cancel (speechSynthesis has no cancel callback)
    const poll = setInterval(() => {
      if (cancelRef?.current) {
        clearInterval(poll)
        speechSynthesis.cancel()
        resolve()
      }
    }, 100)

    utterance.onend = utterance.onerror = () => {
      clearInterval(poll)
      resolve()
    }

    speechSynthesis.speak(utterance)
  })
}

export function stopSpeech() {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}
