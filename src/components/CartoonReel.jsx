import React, { useState, useEffect, useRef, useCallback } from 'react'
import OwlCharacter from './OwlCharacter'
import BunnyCharacter from './BunnyCharacter'
import { factToDialogue } from '../services/dialogueService'
import { speakLine, stopSpeech } from '../services/ttsService'
import { playDing, playWhoops, playSparkle } from '../services/soundService'

const TYPEWRITER_MS = 26
const POST_LINE_MS  = 750

const BG_THEMES = [
  { from: '#1a1a2e', to: '#16213e', stars: true  },
  { from: '#0d2b1a', to: '#1a4a2e', stars: false },
  { from: '#1a1040', to: '#2d1b69', stars: true  },
  { from: '#1e3a5f', to: '#0d2b45', stars: false },
  { from: '#2d1a0e', to: '#4a2c10', stars: false },
]

const FORMAT_COLORS = {
  QUIZ:       'rgba(168,85,247,0.18)',
  TRUE_FALSE: 'rgba(233,69,96,0.18)',
  IMAGINE:    'rgba(74,222,128,0.15)',
  CHALLENGE:  'rgba(251,191,36,0.18)',
  STORY:      'rgba(56,189,248,0.18)',
}

const CONFETTI_COLORS = ['#ff6b6b','#feca57','#48dbfb','#ff9ff3','#1dd1a1','#a29bfe','#fdcb6e','#00b894']

export default function CartoonReel({ facts, onNearEnd, loadingMore }) {
  const [factIdx,       setFactIdx]       = useState(0)
  const [dialogue,      setDialogue]      = useState([])
  const [lineIdx,       setLineIdx]       = useState(0)
  const [displayed,     setDisplayed]     = useState('')
  const [paused,        setPaused]        = useState(false)
  const [muted,         setMuted]         = useState(false)
  const [interactive,   setInteractive]   = useState(null)  // null | InteractiveConfig
  const [showConfetti,  setShowConfetti]  = useState(false)
  const [answerResult,  setAnswerResult]  = useState(null)  // 'correct'|'wrong'|null

  const pausedRef     = useRef(false)
  const cancelRef     = useRef(false)
  const waitingRef    = useRef(false)    // true while paused for kid's answer

  const fact = facts[Math.min(factIdx, facts.length - 1)]

  // ── Rebuild dialogue when fact changes ──────────────────────────────────
  useEffect(() => {
    if (!fact) return
    cancelRef.current  = true
    waitingRef.current = false
    stopSpeech()
    setInteractive(null)
    setAnswerResult(null)
    setShowConfetti(false)
    playSparkle()
    const lines = factToDialogue(fact.text, factIdx)
    setDialogue(lines)
    setLineIdx(0)
    setDisplayed('')
    const t = setTimeout(() => { cancelRef.current = false }, 100)
    return () => clearTimeout(t)
  }, [factIdx])  // eslint-disable-line

  // ── Play current line ───────────────────────────────────────────────────
  useEffect(() => {
    if (!dialogue.length || paused || waitingRef.current) return
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

      // 2. TTS
      if (!muted) await speakLine(line.text, line.speaker, cancelRef)
      if (cancelRef.current) return

      // 3. Interactive pause — show TRUE/FALSE buttons and WAIT
      if (line.interactive) {
        setInteractive(line.interactive)
        waitingRef.current = true
        return   // effect will re-run only after handleAnswer() clears waitingRef
      }

      // 4. Pause between lines
      await new Promise((res) => setTimeout(res, POST_LINE_MS))
      if (cancelRef.current) return

      // 5. Advance
      advanceLine()
    }

    playLine()
    return () => { cancelRef.current = true; clearTimeout(frame); stopSpeech() }
  }, [lineIdx, dialogue, paused, muted])  // eslint-disable-line

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { if (muted) stopSpeech() }, [muted])

  function advanceLine() {
    setLineIdx((prev) => {
      const next = prev + 1
      if (next >= dialogue.length) {
        // Move to next fact
        setFactIdx((fi) => {
          const n = fi + 1
          if (facts.length - n <= 3) onNearEnd()
          return n < facts.length ? n : fi
        })
        return prev
      }
      return next
    })
  }

  // ── Handle kid's TRUE/FALSE answer ──────────────────────────────────────
  function handleAnswer(answer) {
    if (!interactive) return
    const isCorrect = answer === interactive.correctAnswer
    const branch    = isCorrect ? interactive.onCorrect : interactive.onWrong

    if (isCorrect) { playDing();    setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2800) }
    else           { playWhoops(); }

    setAnswerResult(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => setAnswerResult(null), 3000)

    // Splice response lines into dialogue
    const responseLines = [
      { speaker: 'owl',   text: branch.owlText,   characterState: branch.owlState,   format: dialogue[lineIdx]?.format, isReveal: false },
      { speaker: 'bunny', text: branch.bunnyText,  characterState: branch.bunnyState, format: dialogue[lineIdx]?.format, isReveal: true },
    ]
    setDialogue((prev) => [
      ...prev.slice(0, lineIdx + 1),
      ...responseLines,
      ...prev.slice(lineIdx + 1),
    ])

    setInteractive(null)
    waitingRef.current = false
    cancelRef.current  = false

    // Advance to the first response line
    setLineIdx((prev) => prev + 1)
  }

  // ── Navigation ───────────────────────────────────────────────────────────
  const goNext = useCallback(() => {
    if (interactive) return
    cancelRef.current  = true
    waitingRef.current = false
    stopSpeech()
    setTimeout(() => {
      setInteractive(null)
      setFactIdx((prev) => {
        const n = prev + 1
        if (facts.length - n <= 3) onNearEnd()
        return n < facts.length ? n : prev
      })
    }, 80)
  }, [facts.length, onNearEnd, interactive])

  const goPrev = useCallback(() => {
    if (interactive) return
    cancelRef.current  = true
    waitingRef.current = false
    stopSpeech()
    setTimeout(() => { setInteractive(null); setFactIdx((p) => Math.max(0, p - 1)) }, 80)
  }, [interactive])

  useEffect(() => {
    function onKey(e) {
      if (interactive) return
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft')                   { e.preventDefault(); goPrev() }
      if (e.key === 'p' || e.key === 'P')           setPaused((x) => !x)
      if (e.key === 'm' || e.key === 'M')           setMuted((x) => !x)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, interactive])

  const touchStart = useRef(null)
  function onTouchStart(e) { touchStart.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (interactive || !touchStart.current) return
    const dx = touchStart.current - e.changedTouches[0].clientX
    if (dx > 50)  goNext()
    if (dx < -50) goPrev()
    touchStart.current = null
  }

  if (!fact || !dialogue.length) return null

  const line       = dialogue[lineIdx] ?? dialogue[0]
  const bgTheme    = BG_THEMES[factIdx % BG_THEMES.length]
  const format     = line.format ?? 'QUIZ'
  const bubbleTint = FORMAT_COLORS[format] ?? 'transparent'

  // Character states
  const owlState   = line.characterState
    ? (line.speaker === 'owl' ? line.characterState : (line.speaker === 'bunny' ? 'listening' : 'idle'))
    : 'idle'
  const bunnyState = line.characterState
    ? (line.speaker === 'bunny' ? line.characterState : (line.speaker === 'owl' ? 'listening' : 'idle'))
    : 'idle'

  return (
    <div
      className="creel-wrap"
      style={{ background: `linear-gradient(160deg, ${bgTheme.from} 0%, ${bgTheme.to} 100%)` }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {bgTheme.stars && <Stars />}
      {showConfetti && <Confetti />}

      {/* Format badge */}
      <div className={`creel-format-badge creel-format-badge--${format.toLowerCase().replace('_','-')}`}>
        {formatLabel(format)}
      </div>

      {/* Mute toggle */}
      <button className={`creel-mute-btn ${muted ? 'muted' : ''}`}
        onClick={() => setMuted((m) => !m)} title="Mute (M)">
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Topic pill */}
      <div className="creel-topic">
        <span className="creel-topic-emoji">{fact.emoji}</span>
        <span className="creel-topic-text">{fact.badge}</span>
      </div>

      {/* Speech bubble */}
      <div className={`creel-bubble creel-bubble--${line.speaker}`}
        style={{ background: `rgba(255,255,255,0.97)`, borderTop: `3px solid ${bubbleTint.replace('0.18','0.7')}` }}>
        <span className="creel-bubble-text">
          {displayed}<span className="creel-cursor">|</span>
        </span>
        <div className={`creel-bubble-tail creel-bubble-tail--${line.speaker}`} />
      </div>

      {/* TRUE / FALSE interactive buttons */}
      {interactive?.type === 'TRUE_FALSE' && (
        <div className="tf-overlay">
          <p className="tf-prompt">What do YOU think? 🤔</p>
          <div className="tf-buttons">
            <button className="tf-btn tf-btn--true"  onClick={() => handleAnswer('true')}>✅ TRUE</button>
            <button className="tf-btn tf-btn--false" onClick={() => handleAnswer('false')}>❌ FALSE</button>
          </div>
        </div>
      )}

      {/* Answer result flash */}
      {answerResult && (
        <div className={`creel-answer-flash creel-answer-flash--${answerResult}`}>
          {answerResult === 'correct' ? '🎉 CORRECT!' : '❌ Oops!'}
        </div>
      )}

      {/* Characters */}
      <div className="creel-stage">
        <OwlCharacter   state={owlState}   />
        <BunnyCharacter state={bunnyState} />
      </div>

      {/* Controls */}
      <div className="creel-controls">
        <button className="creel-btn" onClick={goPrev} disabled={factIdx === 0 || !!interactive}>◀</button>
        <button className="creel-btn creel-btn--pause"
          onClick={() => { if (!interactive) setPaused((p) => !p) }}
          disabled={!!interactive}>
          {paused ? '▶' : '⏸'}
        </button>
        <button className="creel-btn" onClick={goNext} disabled={!!interactive}>▶</button>
      </div>

      {/* Dialogue dots */}
      <div className="creel-dots">
        {dialogue.map((_, i) => (
          <span key={i} className={`creel-dot ${i === lineIdx ? 'active' : i < lineIdx ? 'done' : ''}`} />
        ))}
      </div>

      <div className="creel-counter">
        Fact {factIdx + 1} / {facts.length}
        {loadingMore ? ' · Loading more…' : ''}
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Confetti() {
  const pieces = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x:        (i * 7.3 + 5) % 100,
      delay:    (i * 0.055) % 1.4,
      duration: 1.6 + (i % 6) * 0.25,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rot:      (i * 53) % 360,
      size:     6 + (i % 4) * 3,
    }))
  ).current

  return (
    <div className="confetti-wrap" aria-hidden>
      {pieces.map((p) => (
        <div key={p.id} className="confetti-piece"
          style={{
            left:              `${p.x}%`,
            background:        p.color,
            width:             p.size,
            height:            p.size,
            animationDelay:    `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rot':           `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}

function Stars() {
  const stars = useRef(
    Array.from({ length: 22 }, (_, i) => ({
      id: i, x: (i * 4.7 + 3) % 100, y: (i * 8.3 + 5) % 45,
      r: (i % 3) + 1, delay: (i * 0.4) % 3,
    }))
  ).current
  return (
    <svg className="creel-stars" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice">
      {stars.map((s) => (
        <circle key={s.id} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="white" opacity={0.6}
          style={{ animationDelay: `${s.delay}s` }} className="star-twinkle" />
      ))}
    </svg>
  )
}

function formatLabel(f) {
  return { QUIZ: '🤔 Quiz!', TRUE_FALSE: '🎯 True or False?', IMAGINE: '🌈 Imagine…', CHALLENGE: '🎮 Challenge!', STORY: '📖 Story Time!' }[f] ?? '💡 Fun Fact!'
}
