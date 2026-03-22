import React, { useState, useRef, useCallback } from 'react'
import { fetchFacts } from '../services/wikipediaService'
import CartoonReel from './CartoonReel'

const SUGGESTIONS = [
  'Who is Charles Darwin', 'How does gravity work', 'What are black holes',
  'Ancient Egypt', 'How do volcanoes erupt', 'What is DNA',
  'Who was Albert Einstein', 'How do rainforests work',
]

export default function StudyReels() {
  const [phase, setPhase] = useState('search')   // 'search' | 'loading' | 'playing' | 'error'
  const [topic, setTopic] = useState('')
  const [facts, setFacts] = useState([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const topicQueue = useRef([])
  const fetchedTopics = useRef(new Set())

  async function handleSearch(t = topic) {
    if (!t.trim()) return
    setPhase('loading')
    setError('')
    setFacts([])
    topicQueue.current = []
    fetchedTopics.current = new Set()

    try {
      const { facts: f, relatedTopics } = await fetchFacts(t.trim())
      fetchedTopics.current.add(t.trim())
      topicQueue.current = relatedTopics.filter((r) => !fetchedTopics.current.has(r))
      setFacts(f)
      setPhase('playing')
    } catch (err) {
      setError(err.message || 'Could not find that topic. Try another!')
      setPhase('error')
    }
  }

  const handleNearEnd = useCallback(async () => {
    if (loadingMore) return
    const next = topicQueue.current.shift()
    if (!next || fetchedTopics.current.has(next)) return

    setLoadingMore(true)
    fetchedTopics.current.add(next)
    try {
      const { facts: more, relatedTopics } = await fetchFacts(next, facts.length)
      topicQueue.current.push(
        ...relatedTopics.filter((r) => !fetchedTopics.current.has(r))
      )
      setFacts((prev) => [...prev, ...more])
    } catch {
      // silently skip this topic and continue
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, facts.length])

  function handleReset() {
    setPhase('search')
    setTopic('')
    setFacts([])
    setError('')
  }

  // ── Search phase ────────────────────────────────────────────────────────────
  if (phase === 'search' || phase === 'error') {
    return (
      <div className="reels-search-wrap">
        <div className="reels-search-card">
          <div className="reels-icon">🎬</div>
          <h2 className="reels-title">Study Reels</h2>
          <p className="reels-sub">
            Type any topic and get fun bite-sized facts — perfect for curious kids!
          </p>

          <div className="reels-input-row">
            <input
              className="reels-input"
              type="text"
              placeholder="e.g. Who is Charles Darwin"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus
            />
            <button
              className="reels-start-btn"
              onClick={() => handleSearch()}
              disabled={!topic.trim()}
            >
              Let's Go! 🚀
            </button>
          </div>

          {error && <p className="reels-error">{error}</p>}

          <p className="reels-suggestions-label">Try these:</p>
          <div className="reels-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="reels-chip"
                onClick={() => { setTopic(s); handleSearch(s) }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Loading phase ───────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="reels-loading">
        <div className="reels-loading-spinner">🔍</div>
        <p>Finding fun facts about<br /><strong>"{topic}"</strong>...</p>
      </div>
    )
  }

  // ── Playing phase ───────────────────────────────────────────────────────────
  return (
    <div className="reels-playing-wrap">
      <div className="reels-playing-header">
        <button className="reels-back-btn" onClick={handleReset}>← Back</button>
        <span className="reels-topic-label">📚 {topic}</span>
        <span className="reels-fact-count">{facts.length} facts loaded</span>
      </div>
      <CartoonReel facts={facts} onNearEnd={handleNearEnd} loadingMore={loadingMore} />
      <p className="reels-hint">Swipe up/down or use arrow keys • Hover to pause</p>
    </div>
  )
}
