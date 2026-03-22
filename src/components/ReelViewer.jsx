import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReelCard from './ReelCard'

const AUTO_ADVANCE_MS = 6000
const NEAR_END_THRESHOLD = 3

export default function ReelViewer({ facts, onNearEnd, loadingMore }) {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState('up')
  const [paused, setPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(AUTO_ADVANCE_MS)
  const timerRef = useRef(null)
  const tickRef = useRef(null)
  const touchStartY = useRef(null)

  const advance = useCallback(() => {
    setIndex((prev) => {
      const next = prev + 1
      if (next >= facts.length) return prev // wait for more facts
      if (facts.length - next <= NEAR_END_THRESHOLD) onNearEnd()
      setDirection('up')
      return next
    })
    setTimeLeft(AUTO_ADVANCE_MS)
  }, [facts.length, onNearEnd])

  const retreat = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1))
    setDirection('down')
    setTimeLeft(AUTO_ADVANCE_MS)
  }, [])

  // Auto-advance timer
  useEffect(() => {
    if (paused) return
    clearInterval(timerRef.current)
    clearInterval(tickRef.current)

    timerRef.current = setInterval(advance, AUTO_ADVANCE_MS)
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 100))
    }, 100)

    return () => {
      clearInterval(timerRef.current)
      clearInterval(tickRef.current)
    }
  }, [paused, advance, index])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); advance() }
      if (e.key === 'ArrowUp') { e.preventDefault(); retreat() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, retreat])

  // Touch/swipe
  function onTouchStart(e) { touchStartY.current = e.touches[0].clientY }
  function onTouchEnd(e) {
    if (touchStartY.current === null) return
    const delta = touchStartY.current - e.changedTouches[0].clientY
    if (delta > 50) advance()
    else if (delta < -50) retreat()
    touchStartY.current = null
  }

  if (!facts.length) return null

  const fact = facts[Math.min(index, facts.length - 1)]
  const progress = ((AUTO_ADVANCE_MS - timeLeft) / AUTO_ADVANCE_MS) * 100

  return (
    <div
      className="reel-viewer"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Progress bar */}
      <div className="reel-progress-track">
        <div
          className="reel-progress-fill"
          style={{ width: paused ? `${progress}%` : `${progress}%`, transition: paused ? 'none' : 'width 0.1s linear' }}
        />
      </div>

      <ReelCard fact={fact} direction={direction} index={index} total={facts.length} />

      {/* Navigation buttons */}
      <button className="reel-nav-btn reel-nav-up" onClick={retreat} disabled={index === 0} aria-label="Previous">
        ▲
      </button>
      <button className="reel-nav-btn reel-nav-down" onClick={advance} disabled={index >= facts.length - 1 && !loadingMore} aria-label="Next">
        ▼
      </button>

      {/* Pause indicator */}
      {paused && <div className="reel-paused-badge">⏸ Paused</div>}

      {/* Loading more indicator */}
      {loadingMore && index >= facts.length - 2 && (
        <div className="reel-loading-more">Loading more facts...</div>
      )}
    </div>
  )
}
