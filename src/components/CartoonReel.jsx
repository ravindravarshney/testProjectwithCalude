import React, { useState, useEffect, useRef, useCallback } from 'react'
import OwlCharacter from './OwlCharacter'
import BunnyCharacter from './BunnyCharacter'
import { factToDialogue } from '../services/dialogueService'
import { speakLine, stopSpeech } from '../services/ttsService'

const TYPEWRITER_MS = 30
const POST_LINE_MS  = 700

const BG_THEMES = [
  { from: '#1a1a2e', to: '#16213e', stars: true  },
  { from: '#0d2b1a', to: '#1a4a2e', stars: false },
  { from: '#1a1040', to: '#2d1b69', stars: true  },
  { from: '#1e3a5f', to: '#0d2b45', stars: false },
  { from: '#2d1a0e', to: '#4a2c10', stars: false },
]

export default function CartoonReel({ facts, onNearEnd, loadingMore }) {
  const [factIdx,    setFactIdx]    = useState(0)
  const [lineIdx,    setLineIdx]    = useState(0)
  const [displayed,  setDisplayed]  = useState('')
  const [dialogue,   setDialogue]   = useState([])
  const [paused,     setPaused]     = useState(false)
  const [muted,      setMuted]      = useState(false)

  const pausedRef = useRef(false)
  const cancelRef = useRef(false)

  const fact = facts[factIdx] ?? facts[0]

  // ── Rebuild dialogue on fact change ──────────────────────────────────────
  useEffect(() => {
    if (!fact) return
    cancelRef.current = true
    stopSpeech()
    const lines = factToDialogue(fact.text, factIdx)
    setDialogue(lines)
    setLineIdx(0)
    setDisplayed('')
    // small delay so previous effect cleanup can finish
    const t = setTimeout(() => { cancelRef.current = false }, 80)
    return () => clearTimeout(t)
  }, [factIdx])  // eslint-disable-line

  // ── Play current dialogue line ────────────────────────────────────────────
  useEffect(() => {
    if (!dialogue.length || paused) return
    const line = dialogue[lineIdx]
    if (!line) return

    cancelRef.current = false
    let frame

    async function playLine() {
      // 1. Typewriter
      let i = 0
      setDisplayed('')
      await new Promise((res) => {
        function tick() {
          if (cancelRef.current) return res()
          if (pausedRef.current) { frame = setTimeout(tick, 60); return }
          i++
          setDisplayed(line.text.slice(0, i))
          if (i < line.text.length) frame = setTimeout(tick, TYPEWRITER_MS)
          else res()
        }
        tick()
      })
      if (cancelRef.current) return

      // 2. Speak (Web Speech API — no network, no gesture needed)
      if (!muted) {
        await speakLine(line.text, line.speaker, cancelRef)
      }
      if (cancelRef.current) return

      // 3. Pause between lines
      await new Promise((res) => setTimeout(res, POST_LINE_MS))
      if (cancelRef.current) return

      // 4. Advance line or fact
      const next = lineIdx + 1
      if (next < dialogue.length) {
        setLineIdx(next)
      } else {
        setFactIdx((prev) => {
          const n = prev + 1
          if (facts.length - n <= 3) onNearEnd()
          return n < facts.length ? n : prev
        })
      }
    }

    playLine()
    return () => {
      cancelRef.current = true
      clearTimeout(frame)
      stopSpeech()
    }
  }, [lineIdx, dialogue, paused, muted])  // eslint-disable-line

  useEffect(() => { pausedRef.current = paused }, [paused])

  // Stop speech when muting
  useEffect(() => { if (muted) stopSpeech() }, [muted])

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    cancelRef.current = true
    stopSpeech()
    setTimeout(() => {
      setFactIdx((prev) => {
        const n = prev + 1
        if (facts.length - n <= 3) onNearEnd()
        return n < facts.length ? n : prev
      })
    }, 80)
  }, [facts.length, onNearEnd])

  const goPrev = useCallback(() => {
    cancelRef.current = true
    stopSpeech()
    setTimeout(() => setFactIdx((prev) => Math.max(0, prev - 1)), 80)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft')                   { e.preventDefault(); goPrev() }
      if (e.key === 'p' || e.key === 'P')           setPaused((p) => !p)
      if (e.key === 'm' || e.key === 'M')           setMuted((m) => !m)
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

  const line       = dialogue[lineIdx] ?? dialogue[0]
  const bgTheme    = BG_THEMES[factIdx % BG_THEMES.length]
  const owlState   = line.speaker === 'owl'   ? 'speaking' : 'listening'
  const bunnyState = line.speaker === 'bunny' ? 'speaking' : 'listening'

  return (
    <div
      className="creel-wrap"
      style={{ background: `linear-gradient(160deg, ${bgTheme.from} 0%, ${bgTheme.to} 100%)` }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {bgTheme.stars && <Stars />}

      {/* Mute toggle */}
      <button
        className={`creel-mute-btn ${muted ? 'muted' : ''}`}
        onClick={() => setMuted((m) => !m)}
        title={muted ? 'Unmute (M)' : 'Mute (M)'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Topic pill */}
      <div className="creel-topic">
        <span className="creel-topic-emoji">{fact.emoji}</span>
        <span className="creel-topic-text">{fact.badge}</span>
      </div>

      {/* Speech bubble */}
      <div className={`creel-bubble creel-bubble--${line.speaker}`}>
        <span className="creel-bubble-text">
          {displayed}<span className="creel-cursor">|</span>
        </span>
        <div className={`creel-bubble-tail creel-bubble-tail--${line.speaker}`} />
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

      {/* Dialogue progress dots */}
      <div className="creel-dots">
        {dialogue.map((_, i) => (
          <span key={i} className={`creel-dot ${i === lineIdx ? 'active' : i < lineIdx ? 'done' : ''}`} />
        ))}
      </div>

      <div className="creel-counter">
        Fact {factIdx + 1} of {facts.length}
        {loadingMore ? ' · Loading more...' : ''}
      </div>
    </div>
  )
}

function Stars() {
  const stars = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      id: i,
      x: (i * 4.7 + 3) % 100,
      y: (i * 8.3 + 5) % 45,
      r: (i % 3) + 1,
      delay: (i * 0.4) % 3,
    }))
  ).current

  return (
    <svg className="creel-stars" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      {stars.map((s) => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r}
          fill="white" opacity={0.6}
          style={{ animationDelay: `${s.delay}s` }}
          className="star-twinkle"
        />
      ))}
    </svg>
  )
}
