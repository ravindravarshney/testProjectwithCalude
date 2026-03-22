import React, { useState, useEffect, useRef, useCallback } from 'react'
import OwlCharacter from './OwlCharacter'
import BunnyCharacter from './BunnyCharacter'
import { factToDialogue } from '../services/dialogueService'
import { fetchTTSAudio } from '../services/ttsService'

const TYPEWRITER_MS = 28   // ms per character
const POST_LINE_MS  = 900  // pause after each line before next starts

const BG_THEMES = [
  { from: '#1a1a2e', to: '#16213e', stars: true  },  // night sky
  { from: '#0d2b1a', to: '#1a4a2e', stars: false },  // forest
  { from: '#1a1040', to: '#2d1b69', stars: true  },  // deep space
  { from: '#1e3a5f', to: '#0d2b45', stars: false },  // ocean
  { from: '#2d1a0e', to: '#4a2c10', stars: false },  // warm earth
]

export default function CartoonReel({ facts, onNearEnd, loadingMore }) {
  const [factIdx,   setFactIdx]   = useState(0)
  const [lineIdx,   setLineIdx]   = useState(0)
  const [displayed, setDisplayed] = useState('')   // typewriter text
  const [dialogue,  setDialogue]  = useState([])
  const [paused,    setPaused]    = useState(false)
  const pausedRef  = useRef(false)
  const cancelRef  = useRef(false)   // signals current line sequence to abort

  const fact = facts[factIdx] ?? facts[0]

  // Rebuild dialogue when fact changes
  useEffect(() => {
    if (!fact) return
    const lines = factToDialogue(fact.text, factIdx)
    setDialogue(lines)
    setLineIdx(0)
    setDisplayed('')
  }, [factIdx, fact])

  // Play a line: typewriter + TTS, then advance
  useEffect(() => {
    if (!dialogue.length || paused) return
    const line = dialogue[lineIdx]
    if (!line) return

    cancelRef.current = false
    let frame

    async function playLine() {
      // 1. Typewriter animation
      let i = 0
      setDisplayed('')
      await new Promise((res) => {
        function tick() {
          if (cancelRef.current) return res()
          if (pausedRef.current) { frame = setTimeout(tick, 50); return }
          i++
          setDisplayed(line.text.slice(0, i))
          if (i < line.text.length) frame = setTimeout(tick, TYPEWRITER_MS)
          else res()
        }
        tick()
      })
      if (cancelRef.current) return

      // 2. TTS audio
      try {
        const voice = line.speaker === 'owl' ? 'Brian' : 'Amy'
        const buf  = await fetchTTSAudio(line.text, voice)
        if (cancelRef.current) return
        const blob = new Blob([buf], { type: 'audio/mpeg' })
        const url  = URL.createObjectURL(blob)
        const audio = new Audio(url)
        await new Promise((res) => {
          audio.onended = res
          audio.onerror = res
          audio.play().catch(res)
        })
        URL.revokeObjectURL(url)
      } catch { /* silent fallback — continue without audio */ }

      if (cancelRef.current) return

      // 3. Brief pause between lines
      await new Promise((res) => setTimeout(res, POST_LINE_MS))
      if (cancelRef.current) return

      // 4. Advance
      const nextLine = lineIdx + 1
      if (nextLine < dialogue.length) {
        setLineIdx(nextLine)
      } else {
        // All dialogue done — advance to next fact
        setFactIdx((prev) => {
          const next = prev + 1
          if (facts.length - next <= 3) onNearEnd()
          return next < facts.length ? next : prev
        })
      }
    }

    playLine()
    return () => { cancelRef.current = true; clearTimeout(frame) }
  }, [lineIdx, dialogue, paused])   // eslint-disable-line

  // Sync paused ref
  useEffect(() => { pausedRef.current = paused }, [paused])

  const goNext = useCallback(() => {
    cancelRef.current = true
    setTimeout(() => {
      setFactIdx((prev) => {
        const next = prev + 1
        if (facts.length - next <= 3) onNearEnd()
        return next < facts.length ? next : prev
      })
    }, 50)
  }, [facts.length, onNearEnd])

  const goPrev = useCallback(() => {
    cancelRef.current = true
    setTimeout(() => setFactIdx((prev) => Math.max(0, prev - 1)), 50)
  }, [])

  // Keyboard + swipe
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft')                   { e.preventDefault(); goPrev() }
      if (e.key === 'p' || e.key === 'P')           setPaused((p) => !p)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev])

  const touchStart = useRef(null)
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (!touchStart.current) return
    const dx = touchStart.current - e.changedTouches[0].clientX
    if (dx > 50)  goNext()
    if (dx < -50) goPrev()
    touchStart.current = null
  }

  if (!fact || !dialogue.length) return null

  const line    = dialogue[lineIdx] ?? dialogue[0]
  const bgTheme = BG_THEMES[factIdx % BG_THEMES.length]
  const owlState  = !line ? 'idle' : line.speaker === 'owl'   ? 'speaking' : 'listening'
  const bunnyState = !line ? 'idle' : line.speaker === 'bunny' ? 'speaking' : 'listening'

  return (
    <div
      className="creel-wrap"
      style={{ background: `linear-gradient(160deg, ${bgTheme.from} 0%, ${bgTheme.to} 100%)` }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {bgTheme.stars && <Stars />}

      {/* Topic pill */}
      <div className="creel-topic">
        <span className="creel-topic-emoji">{fact.emoji}</span>
        <span className="creel-topic-text">{fact.badge}</span>
      </div>

      {/* Speech bubble */}
      <div className={`creel-bubble creel-bubble--${line?.speaker ?? 'owl'}`}>
        <span className="creel-bubble-text">{displayed}<span className="creel-cursor">|</span></span>
        <div className={`creel-bubble-tail creel-bubble-tail--${line?.speaker ?? 'owl'}`} />
      </div>

      {/* Characters */}
      <div className="creel-stage">
        <OwlCharacter   state={owlState}   />
        <BunnyCharacter state={bunnyState} />
      </div>

      {/* Controls */}
      <div className="creel-controls">
        <button className="creel-btn" onClick={goPrev} disabled={factIdx === 0}>◀</button>
        <button className="creel-btn creel-btn--pause" onClick={() => setPaused((p) => !p)}>
          {paused ? '▶' : '⏸'}
        </button>
        <button className="creel-btn" onClick={goNext}>▶</button>
      </div>

      {/* Progress dots */}
      <div className="creel-dots">
        {dialogue.map((_, i) => (
          <span key={i} className={`creel-dot ${i === lineIdx ? 'active' : i < lineIdx ? 'done' : ''}`} />
        ))}
      </div>

      {/* Fact counter */}
      <div className="creel-counter">Fact {factIdx + 1} of {facts.length}{loadingMore ? ' · Loading more...' : ''}</div>
    </div>
  )
}

function Stars() {
  const stars = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 45,
    r: Math.random() * 2 + 1,
    delay: Math.random() * 3,
  }))
  return (
    <svg className="creel-stars" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      {stars.map((s) => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white"
          opacity={0.6} style={{ animationDelay: `${s.delay}s` }} className="star-twinkle" />
      ))}
    </svg>
  )
}
